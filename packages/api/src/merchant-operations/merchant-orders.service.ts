import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';
import { MERCHANT_SETTABLE_ORDER_STATUSES, PatchOrderStatusDto } from './dto/orders.dto';
import { MerchantRealtimeBridge } from './merchant-realtime.bridge';

@Injectable()
export class MerchantOrdersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly realtime: MerchantRealtimeBridge,
  ) {}

  async listOrders(
    merchantId: string,
    limit = 100,
    expandItems = false,
  ): Promise<unknown[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const baseFields =
      'id, order_number, status, type, subtotal, delivery_fee, tax, discount, total, paystack_reference, created_at, updated_at, merchant_id, delivery_address, special_instructions';
    const select = expandItems
      ? `${baseFields}, order_items ( id, name, price, quantity, subtotal, modifiers, menu_item_id )`
      : baseFields;

    const { data, error } = await this.supabase.db
      .from('orders')
      .select(select)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async getOrder(merchantId: string, orderId: string): Promise<unknown> {
    const { data: order, error: oErr } = await this.supabase.db
      .from('orders')
      .select(
        'id, order_number, status, type, subtotal, delivery_fee, tax, discount, total, paystack_reference, delivery_address, special_instructions, created_at, updated_at, merchant_id',
      )
      .eq('id', orderId)
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (oErr) {
      throw new ConflictException(oErr.message);
    }
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const { data: items, error: iErr } = await this.supabase.db
      .from('order_items')
      .select('id, name, price, quantity, subtotal, modifiers, menu_item_id, order_id')
      .eq('order_id', orderId);

    if (iErr) {
      throw new ConflictException(iErr.message);
    }

    return { ...order, order_items: items ?? [] };
  }

  async patchOrderStatus(
    merchantId: string,
    orderId: string,
    dto: PatchOrderStatusDto,
  ): Promise<unknown> {
    if (
      !(MERCHANT_SETTABLE_ORDER_STATUSES as readonly string[]).includes(dto.status)
    ) {
      throw new BadRequestException('Unsupported status transition.');
    }

    const { data: existing, error: readErr } = await this.supabase.db
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (readErr || !existing) {
      throw new NotFoundException('Order not found');
    }

    const { data, error } = await this.supabase.db
      .from('orders')
      .update({
        status: dto.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('merchant_id', merchantId)
      .select(
        'id, status, type, subtotal, delivery_fee, tax, discount, total, paystack_reference, created_at, updated_at',
      )
      .single();

    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Update failed');
    }

    try {
      const full = (await this.getOrder(merchantId, orderId)) as Record<
        string,
        unknown
      >;
      this.realtime.emitOrderUpdated(merchantId, full);
    } catch (e) {
      /* non-fatal: status already persisted */
    }

    return data;
  }

  async listDisputes(merchantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.db
      .from('dispute_cases')
      .select(
        'id, order_id, customer_id, reason, description, status, opened_at, resolved_at, refund_amount',
      )
      .eq('merchant_id', merchantId)
      .order('opened_at', { ascending: false })
      .limit(100);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }
}
