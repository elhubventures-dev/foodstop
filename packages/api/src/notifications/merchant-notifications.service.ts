import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type MerchantNotificationType =
  | 'wallet_credit'
  | 'wallet_release'
  | 'wallet_clawback'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'monthly_invoice'
  | 'order_new'
  | 'order_cancelled'
  | 'withdrawal_processing'
  | 'withdrawal_completed'
  | 'withdrawal_failed'
  | 'account_approved'
  | 'application_rejected'
  | 'application_rfi'
  | 'platform_broadcast';

export interface MerchantNotificationPayload {
  type: MerchantNotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class MerchantNotificationsService {
  private readonly logger = new Logger(MerchantNotificationsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async notify(
    merchantId: string,
    payload: MerchantNotificationPayload,
  ): Promise<void> {
    const { error } = await this.supabase.db
      .from('merchant_notifications')
      .insert({
        merchant_id: merchantId,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        data: payload.data ?? null,
      });

    if (error) {
      this.logger.error(
        `Failed to write merchant_notifications for ${merchantId}: ${error.message}`,
      );
      return;
    }

    this.logger.debug(
      `Notification sent → merchant=${merchantId} type=${payload.type}`,
    );
  }

  async listInbox(
    merchantId: string,
    opts: { limit?: number; unreadOnly?: boolean },
  ): Promise<unknown[]> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    let q = this.supabase.db
      .from('merchant_notifications')
      .select('id, type, title, body, data, is_read, created_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (opts.unreadOnly) {
      q = q.eq('is_read', false);
    }
    const { data, error } = await q;
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async markRead(merchantId: string, notificationId: string): Promise<void> {
    const { error } = await this.supabase.db
      .from('merchant_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('merchant_id', merchantId);
    if (error) {
      throw new ConflictException(error.message);
    }
  }

  async markAllRead(merchantId: string): Promise<void> {
    const { error } = await this.supabase.db
      .from('merchant_notifications')
      .update({ is_read: true })
      .eq('merchant_id', merchantId)
      .eq('is_read', false);
    if (error) {
      throw new ConflictException(error.message);
    }
  }
}
