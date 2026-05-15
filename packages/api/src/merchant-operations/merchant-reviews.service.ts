import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MerchantReviewsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listReviews(merchantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.db
      .from('merchant_reviews')
      .select(
        'id, merchant_id, customer_id, order_id, food_rating, service_rating, review_text, reply_text, reply_at, photos, is_flagged, flag_reason, created_at',
      )
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async replyToReview(
    merchantId: string,
    reviewId: string,
    replyText: string,
  ): Promise<unknown> {
    const { data: row, error: readErr } = await this.supabase.db
      .from('merchant_reviews')
      .select('id')
      .eq('id', reviewId)
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (readErr) {
      throw new ConflictException(readErr.message);
    }
    if (!row) {
      throw new NotFoundException('Review not found');
    }

    const now = new Date().toISOString();
    const { data, error } = await this.supabase.db
      .from('merchant_reviews')
      .update({ reply_text: replyText, reply_at: now })
      .eq('id', reviewId)
      .eq('merchant_id', merchantId)
      .select(
        'id, merchant_id, customer_id, order_id, food_rating, service_rating, review_text, reply_text, reply_at, created_at',
      )
      .maybeSingle();

    if (error) {
      throw new ConflictException(error.message);
    }
    return data;
  }
}
