import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '../config/configuration';
import { SupabaseService } from '../supabase/supabase.service';
import { CommissionService } from '../commission/commission.service';
import { MerchantNotificationsService } from '../notifications/merchant-notifications.service';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

interface DisputeRow {
  id: string;
  order_id: string;
  merchant_id: string;
  customer_id: string;
  status: string;
  refund_amount: number | string | null;
}

interface LedgerRow {
  merchant_id: string;
  merchant_net: number | string;
  released_at: string | null;
}

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly commission: CommissionService,
    private readonly notifications: MerchantNotificationsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private async isFeatureEnabled(flagKey: string): Promise<boolean> {
    const { data } = await this.supabase.db
      .from('platform_feature_flags')
      .select('enabled')
      .eq('flag_key', flagKey)
      .maybeSingle();
    return !!(data as { enabled?: boolean } | null)?.enabled;
  }

  /**
   * Opens a dispute case and EXTENDS the merchant's pending hold:
   *   1. Inserts dispute_cases row (status='open').
   *   2. Cancels the scheduled release-pending-balance job (funds stay in pending).
   *   3. Notifies the merchant.
   *
   * The release will only resume after `resolve()` is called with
   * outcome='resolved_no_refund' (which re-schedules the job).
   */
  async openDispute(dto: OpenDisputeDto): Promise<DisputeRow> {
    const { data: order, error: oerr } = await this.supabase.db
      .from('orders')
      .select('id, merchant_id, status')
      .eq('id', dto.orderId)
      .single();

    if (oerr || !order) {
      throw new NotFoundException(`Order ${dto.orderId} not found.`);
    }
    if (!order.merchant_id) {
      throw new BadRequestException(
        `Order ${dto.orderId} has no merchant_id.`,
      );
    }

    const { data: existing } = await this.supabase.db
      .from('dispute_cases')
      .select('id, status')
      .eq('order_id', dto.orderId)
      .in('status', ['open', 'investigating'])
      .maybeSingle();

    if (existing) {
      throw new ConflictException(
        `Dispute already open for order ${dto.orderId}: ${existing.id}`,
      );
    }

    const { data, error } = await this.supabase.db
      .from('dispute_cases')
      .insert({
        order_id: dto.orderId,
        merchant_id: order.merchant_id,
        customer_id: dto.customerId,
        reason: dto.reason,
        description: dto.description ?? null,
        evidence_urls: dto.evidenceUrls ?? null,
        status: 'open',
      })
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(
        `Failed to insert dispute_cases for order=${dto.orderId}: ${error?.message}`,
      );
      throw new ConflictException(
        `Failed to open dispute: ${error?.message ?? 'unknown'}`,
      );
    }

    await this.commission.cancelReleaseJob(dto.orderId);

    await this.notifications.notify(order.merchant_id, {
      type: 'dispute_opened',
      title: 'Customer dispute opened',
      body: `A dispute has been raised on order ${dto.orderId}. Funds for this order remain on hold pending review.`,
      data: { orderId: dto.orderId, disputeId: data.id, reason: dto.reason },
    });

    return data as DisputeRow;
  }

  /**
   * Resolves an open dispute. Behavior by outcome:
   *
   *   - resolved_no_refund / closed:
   *       update dispute, then RE-SCHEDULE the release job for now+0 (tiny
   *       delay) so funds flow through the normal release pipeline.
   *
   *   - resolved_refund (with refundAmount):
   *       call clawback RPC to debit pending (or available) balance, write
   *       refund_deduction transaction, mark original credit reversed.
   *       NO release job is scheduled.
   */
  async resolveDispute(dto: ResolveDisputeDto): Promise<{
    disputeId: string;
    outcome: string;
    rescheduledReleaseAt?: string;
    clawbackAmount?: number;
  }> {
    const { data: dispute, error } = await this.supabase.db
      .from('dispute_cases')
      .select('id, order_id, merchant_id, customer_id, status, refund_amount')
      .eq('id', dto.disputeId)
      .single();

    if (error || !dispute) {
      throw new NotFoundException(`Dispute ${dto.disputeId} not found.`);
    }
    const d = dispute as DisputeRow;

    if (!['open', 'investigating'].includes(d.status)) {
      throw new ConflictException(
        `Dispute ${dto.disputeId} is already in terminal status=${d.status}.`,
      );
    }

    const updateRes = await this.supabase.db
      .from('dispute_cases')
      .update({
        status: dto.outcome,
        resolution_note: dto.resolutionNote ?? null,
        refund_amount: dto.refundAmount ?? null,
        resolved_by: dto.resolvedBy ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', dto.disputeId);

    if (updateRes.error) {
      throw new ConflictException(
        `Failed to update dispute_cases: ${updateRes.error.message}`,
      );
    }

    if (dto.outcome === 'resolved_refund') {
      if (!dto.refundAmount || dto.refundAmount <= 0) {
        throw new BadRequestException(
          'refundAmount is required and must be > 0 for resolved_refund.',
        );
      }
      const { data: rpcData, error: rpcErr } = await this.supabase.db.rpc(
        'clawback_merchant_pending_for_refund',
        {
          p_order_id: d.order_id,
          p_dispute_id: d.id,
          p_refund_amount: dto.refundAmount,
        },
      );
      if (rpcErr) {
        throw new ConflictException(
          `clawback_merchant_pending_for_refund failed: ${rpcErr.message}`,
        );
      }
      this.logger.log(
        `Clawback complete order=${d.order_id} amount=${dto.refundAmount} rpc=${JSON.stringify(rpcData)}`,
      );

      await this.notifications.notify(d.merchant_id, {
        type: 'wallet_clawback',
        title: 'Dispute resolved with refund',
        body: `₦${dto.refundAmount.toLocaleString('en-NG')} has been clawed back from your wallet for order ${d.order_id}.`,
        data: {
          orderId: d.order_id,
          disputeId: d.id,
          clawbackAmount: dto.refundAmount,
        },
      });

      return {
        disputeId: d.id,
        outcome: dto.outcome,
        clawbackAmount: dto.refundAmount,
      };
    }

    const { data: ledger } = await this.supabase.db
      .from('platform_commission_ledger')
      .select('merchant_id, merchant_net, released_at')
      .eq('order_id', d.order_id)
      .maybeSingle();

    if (ledger && !(ledger as LedgerRow).released_at) {
      const amount = Number((ledger as LedgerRow).merchant_net) || 0;
      const escrowExtend = await this.isFeatureEnabled('escrow_dispute_extension');
      const delayHoursOverride = escrowExtend
        ? this.config.get('commission.disputeHoldHours', { infer: true })
        : 0;
      const runAt = await this.commission.scheduleReleaseJob({
        orderId: d.order_id,
        merchantId: d.merchant_id,
        amount,
        cause: 'dispute_resolved',
        delayHoursOverride,
      });

      const holdMsg =
        delayHoursOverride > 0
          ? `after a ${delayHoursOverride}h post-dispute hold (escrow extension).`
          : 'shortly.';
      await this.notifications.notify(d.merchant_id, {
        type: 'dispute_resolved',
        title: 'Dispute resolved — funds releasing',
        body: `Dispute on order ${d.order_id} resolved in your favour. ₦${amount.toLocaleString('en-NG')} will move to available ${holdMsg}`,
        data: { orderId: d.order_id, disputeId: d.id, amount },
      });

      return {
        disputeId: d.id,
        outcome: dto.outcome,
        rescheduledReleaseAt: runAt.toISOString(),
      };
    }

    return { disputeId: d.id, outcome: dto.outcome };
  }
}
