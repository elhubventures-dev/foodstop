import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import type { AppConfig } from '../config/configuration';
import { SupabaseService } from '../supabase/supabase.service';
import { MerchantNotificationsService } from '../notifications/merchant-notifications.service';
import {
  CommissionResult,
  CreditRpcRow,
  MerchantRow,
  OrderRow,
  RELEASE_PENDING_QUEUE,
  RELEASE_PENDING_JOB_NAME,
  ReleasePendingJobData,
  ReleaseRpcRow,
  jobIdForOrder,
} from './commission.types';

const round2 = (n: number): number => Math.round(n * 100) / 100;
const toNumber = (v: number | string | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v);

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly notifications: MerchantNotificationsService,
    @InjectQueue(RELEASE_PENDING_QUEUE)
    private readonly releaseQueue: Queue<ReleasePendingJobData>,
  ) {}

  /**
   * MUST be called only when an order transitions to status === 'delivered'.
   * Splits the food subtotal: platform takes commission_rate (default 15%),
   * merchant gets the remainder credited to their pending wallet, and a release
   * job is scheduled for `pending_hold_hours` later. Idempotent per orderId.
   */
  async processOrderCommission(orderId: string): Promise<CommissionResult> {
    const order = await this.fetchOrder(orderId);

    if (order.status !== 'delivered') {
      throw new BadRequestException(
        `Order ${orderId} is not delivered (status=${order.status}). Commission is only processed on DELIVERED.`,
      );
    }

    if (!order.merchant_id) {
      throw new BadRequestException(
        `Order ${orderId} has no merchant_id — cannot route commission.`,
      );
    }

    const merchant = await this.fetchMerchant(order.merchant_id);
    if (merchant.is_suspended) {
      this.logger.warn(
        `Merchant ${merchant.id} is suspended; processing commission but flagging for review.`,
      );
    }

    const commissionRate =
      toNumber(merchant.commission_rate) ||
      this.config.get('commission.defaultRate', { infer: true });
    const vatRate = this.config.get('commission.vatRate', { infer: true });

    const foodSubtotal = round2(toNumber(order.subtotal));

    if (foodSubtotal <= 0) {
      throw new BadRequestException(
        `Order ${orderId} has non-positive subtotal — cannot process commission.`,
      );
    }

    const grandTotal = round2(toNumber(order.total));
    const orderRef = order.paystack_reference ?? order.id;

    const { data, error } = await this.supabase.db.rpc(
      'credit_merchant_for_delivered_order',
      {
        p_order_id: order.id,
        p_merchant_id: merchant.id,
        p_food_subtotal: foodSubtotal,
        p_grand_total: grandTotal,
        p_commission_rate: commissionRate,
        p_vat_rate: vatRate,
        p_order_reference: orderRef,
      },
    );

    if (error) {
      this.logger.error(
        `credit_merchant_for_delivered_order RPC failed for order=${order.id}: ${error.message}`,
      );
      throw new ConflictException(
        `Failed to credit merchant for order ${order.id}: ${error.message}`,
      );
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | CreditRpcRow
      | undefined;

    if (!row) {
      throw new ConflictException(
        `RPC returned no rows for order ${order.id}.`,
      );
    }

    const commissionAmount = toNumber(row.commission_amt);
    const vatAmount = toNumber(row.vat_amount);
    const merchantNet = toNumber(row.merchant_net);

    let releaseAt: Date | null = null;

    if (!row.was_idempotent) {
      releaseAt = await this.scheduleReleaseJob({
        orderId: order.id,
        merchantId: merchant.id,
        amount: merchantNet,
        cause: 'initial',
      });

      await this.notifications.notify(merchant.id, {
        type: 'wallet_credit',
        title: 'Order delivered — wallet credited',
        body: `₦${merchantNet.toLocaleString('en-NG')} pending. Released after the ${this.config.get('commission.pendingHoldHours', { infer: true })}-hour hold.`,
        data: {
          orderId: order.id,
          orderReference: orderRef,
          merchantNet,
          commissionAmount,
          vatAmount,
          releaseAt: releaseAt.toISOString(),
        },
      });
    }

    return {
      ledgerId: row.ledger_id,
      orderId: order.id,
      merchantId: merchant.id,
      foodSubtotal,
      commissionRate,
      commissionAmount,
      vatAmount,
      merchantNet,
      releaseScheduledAt: releaseAt,
      wasIdempotent: row.was_idempotent,
    };
  }

  /**
   * Called by the BullMQ processor (or directly after dispute resolution).
   * Atomic move: pending → available + completes the wallet transaction.
   * Refuses if an open dispute exists (caller should re-queue on resolve).
   */
  async releasePendingForOrder(orderId: string): Promise<{
    released: boolean;
    reason: string;
    amount: number;
  }> {
    const { data, error } = await this.supabase.db.rpc(
      'release_merchant_pending_for_order',
      { p_order_id: orderId },
    );

    if (error) {
      this.logger.error(
        `release_merchant_pending_for_order RPC failed for order=${orderId}: ${error.message}`,
      );
      throw new ConflictException(error.message);
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | ReleaseRpcRow
      | undefined;

    if (!row) {
      return { released: false, reason: 'no_row', amount: 0 };
    }

    return {
      released: row.released,
      reason: row.reason,
      amount: toNumber(row.amount),
    };
  }

  /**
   * Schedules (or re-schedules) the release job for an order.
   * Idempotent on (orderId): reuses the BullMQ jobId so a re-call replaces
   * any pending delayed job instead of stacking duplicates.
   */
  async scheduleReleaseJob(params: {
    orderId: string;
    merchantId: string;
    amount: number;
    cause: ReleasePendingJobData['cause'];
    delayHoursOverride?: number;
  }): Promise<Date> {
    const hours =
      params.delayHoursOverride ??
      this.config.get('commission.pendingHoldHours', { infer: true }) ??
      2;
    const delayMs = Math.max(0, hours * 60 * 60 * 1000);
    const runAt = new Date(Date.now() + delayMs);
    const jobId = jobIdForOrder(params.orderId);

    await this.releaseQueue.remove(jobId).catch(() => undefined);

    await this.releaseQueue.add(
      RELEASE_PENDING_JOB_NAME,
      {
        merchantId: params.merchantId,
        orderId: params.orderId,
        amount: params.amount,
        scheduledFor: runAt.toISOString(),
        cause: params.cause,
      },
      {
        jobId,
        delay: delayMs,
        attempts: 5,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    );

    this.logger.log(
      `Scheduled release for order=${params.orderId} merchant=${params.merchantId} amount=${params.amount} runAt=${runAt.toISOString()} cause=${params.cause}`,
    );
    return runAt;
  }

  async cancelReleaseJob(orderId: string): Promise<void> {
    const jobId = jobIdForOrder(orderId);
    const job = await this.releaseQueue.getJob(jobId);
    if (!job) {
      this.logger.debug(`No release job to cancel for order=${orderId}`);
      return;
    }
    await job.remove();
    this.logger.log(`Cancelled release job for order=${orderId}`);
  }

  private async fetchOrder(orderId: string): Promise<OrderRow> {
    const { data, error } = await this.supabase.db
      .from('orders')
      .select(
        'id, user_id, merchant_id, status, subtotal, delivery_fee, tax, discount, total, paystack_reference',
      )
      .eq('id', orderId)
      .single();

    if (error || !data) {
      throw new NotFoundException(
        `Order ${orderId} not found: ${error?.message ?? 'no data'}`,
      );
    }
    return data as OrderRow;
  }

  private async fetchMerchant(merchantId: string): Promise<MerchantRow> {
    const { data, error } = await this.supabase.db
      .from('merchants')
      .select('id, business_name, commission_rate, is_suspended')
      .eq('id', merchantId)
      .single();

    if (error || !data) {
      throw new NotFoundException(
        `Merchant ${merchantId} not found: ${error?.message ?? 'no data'}`,
      );
    }
    return data as MerchantRow;
  }
}
