import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateMerchantPromotionDto,
  PatchMerchantPromotionDto,
} from './dto/merchant-promotions.dto';

@Injectable()
export class MerchantPromotionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listPromotions(merchantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.db
      .from('merchant_promotions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  private validateDiscount(dto: CreateMerchantPromotionDto): void {
    const v = dto.discount_value;
    if (dto.discount_type === 'percent') {
      if (v == null || Number.isNaN(Number(v))) {
        throw new BadRequestException('discount_value is required for percent.');
      }
      if (Number(v) < 0 || Number(v) > 100) {
        throw new BadRequestException('Percent discount must be between 0 and 100.');
      }
    } else if (dto.discount_type === 'fixed') {
      if (v == null || Number(v) <= 0) {
        throw new BadRequestException('discount_value must be positive for fixed.');
      }
    }
    // free_delivery: value optional
  }

  async createPromotion(
    merchantId: string,
    dto: CreateMerchantPromotionDto,
  ): Promise<unknown> {
    this.validateDiscount(dto);
    const code = dto.code.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('code is required.');
    }

    const row = {
      merchant_id: merchantId,
      code,
      discount_type: dto.discount_type,
      discount_value:
        dto.discount_value != null ? Number(dto.discount_value) : null,
      min_order: dto.min_order != null ? Number(dto.min_order) : 0,
      max_uses: dto.max_uses ?? null,
      valid_from: dto.valid_from ?? null,
      valid_to: dto.valid_to ?? null,
      is_active: true,
    };

    const { data, error } = await this.supabase.db
      .from('merchant_promotions')
      .insert(row)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('A promotion with this code already exists.');
      }
      throw new ConflictException(error.message);
    }
    return data;
  }

  async patchPromotion(
    merchantId: string,
    id: string,
    dto: PatchMerchantPromotionDto,
  ): Promise<unknown> {
    const patch: Record<string, unknown> = {};
    if (dto.is_active !== undefined) patch.is_active = dto.is_active;
    if (dto.valid_to !== undefined) patch.valid_to = dto.valid_to;
    if (dto.max_uses !== undefined) patch.max_uses = dto.max_uses;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update.');
    }

    const { data, error } = await this.supabase.db
      .from('merchant_promotions')
      .update(patch)
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new ConflictException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Promotion not found');
    }
    return data;
  }

  async deletePromotion(merchantId: string, id: string): Promise<void> {
    const { data, error } = await this.supabase.db
      .from('merchant_promotions')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .select('id');

    if (error) {
      throw new ConflictException(error.message);
    }
    if (!data?.length) {
      throw new NotFoundException('Promotion not found');
    }
  }
}
