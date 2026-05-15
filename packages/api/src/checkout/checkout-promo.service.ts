import { BadRequestException, Injectable } from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';
import { ValidatePromoDto } from './dto/validate-promo.dto';

export type ValidatePromoResult =
  | { valid: false; reason?: string; min_order?: number }
  | {
      valid: true;
      promotion_id: string;
      code: string;
      discount: number;
      delivery_fee: number;
      total: number;
    };

@Injectable()
export class CheckoutPromoService {
  constructor(private readonly supabase: SupabaseService) {}

  async validate(dto: ValidatePromoDto): Promise<ValidatePromoResult> {
    const { data, error } = await this.supabase.db.rpc('validate_merchant_promo', {
      p_merchant_id: dto.merchant_id,
      p_code: dto.code,
      p_subtotal: dto.subtotal,
      p_delivery_fee: dto.delivery_fee,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const row = data as Record<string, unknown> | null;
    if (!row || typeof row !== 'object') {
      return { valid: false, reason: 'empty' };
    }
    if (row.valid !== true) {
      return {
        valid: false,
        reason: typeof row.reason === 'string' ? row.reason : undefined,
        min_order: typeof row.min_order === 'number' ? row.min_order : undefined,
      };
    }

    return {
      valid: true,
      promotion_id: String(row.promotion_id),
      code: String(row.code),
      discount: Number(row.discount ?? 0),
      delivery_fee: Number(row.delivery_fee ?? 0),
      total: Number(row.total ?? 0),
    };
  }
}
