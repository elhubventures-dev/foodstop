import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

import type { AppConfig } from '../config/configuration';
import { SupabaseService } from '../supabase/supabase.service';
import { MerchantNotificationsService } from '../notifications/merchant-notifications.service';
import { normalizeNigerianPhoneTo234 } from '../merchant-registration/utils/nigerian-phone';

const round2 = (n: number): number => Math.round(n * 100) / 100;

const WD_OTP_REDIS_PREFIX = 'withdrawal_otp:';
const WD_OTP_FAIL_PREFIX = 'withdrawal_otp_fail:';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly notifications: MerchantNotificationsService,
    @Inject('MERCHANT_REDIS') private readonly redis: Redis,
  ) {}

  /**
   * Step 1 — create withdrawal, debit available + increment total_withdrawn,
   * insert pending wallet transaction (optimistic; Paystack still pending).
   */
  async requestWithdrawal(
    merchantId: string,
    input: { bankAccountId: string; amount: number },
  ): Promise<{
    withdrawal_id: string;
    amount: number;
    status: string;
    admin_approved: boolean;
  }> {
    const min = this.config.get('withdrawal.minAmountNgn', { infer: true });
    const threshold = this.config.get(
      'withdrawal.adminApprovalThresholdNgn',
      { infer: true },
    );
    const amount = round2(input.amount);
    if (amount < min) {
      throw new BadRequestException(
        `Minimum withdrawal is ₦${min.toLocaleString('en-NG')}.`,
      );
    }

    const { data: bank, error: bErr } = await this.supabase.db
      .from('merchant_bank_accounts')
      .select(
        'id, merchant_id, bank_name, bank_code, account_number, account_name, is_verified, paystack_recipient_code',
      )
      .eq('id', input.bankAccountId)
      .eq('merchant_id', merchantId)
      .single();

    if (bErr || !bank) {
      throw new NotFoundException('Bank account not found for this merchant.');
    }
    if (!bank.is_verified) {
      throw new BadRequestException(
        'Bank account must be verified before withdrawal.',
      );
    }

    const { data: wallet, error: wErr } = await this.supabase.db
      .from('merchant_wallets')
      .select('available_balance')
      .eq('merchant_id', merchantId)
      .single();

    if (wErr || !wallet) {
      throw new NotFoundException('Merchant wallet not found.');
    }

    const available = round2(Number(wallet.available_balance));
    if (available < amount) {
      throw new BadRequestException(
        `Insufficient available balance (₦${available.toLocaleString('en-NG')}).`,
      );
    }

    const adminApproved = amount < threshold;

    const txRef = `WD-REQ-${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    const { data: wdRow, error: wdErr } = await this.supabase.db
      .from('merchant_withdrawals')
      .insert({
        merchant_id: merchantId,
        amount,
        bank_name: bank.bank_name,
        bank_code: bank.bank_code,
        account_number: bank.account_number,
        account_name: bank.account_name,
        paystack_recipient_code: bank.paystack_recipient_code,
        status: 'pending',
        otp_verified: false,
        admin_approved: adminApproved,
      })
      .select('id, amount, status, admin_approved')
      .single();

    if (wdErr || !wdRow) {
      this.logger.error(wdErr?.message);
      throw new UnprocessableEntityException(
        'Could not create withdrawal record.',
      );
    }

    const withdrawalId = wdRow.id as string;

    const { error: decErr } = await this.supabase.db.rpc(
      'merchant_wallet_debit_withdrawal',
      {
        p_merchant_id: merchantId,
        p_amount: amount,
        p_withdrawal_id: withdrawalId,
        p_reference: txRef,
      },
    );

    if (decErr) {
      await this.supabase.db
        .from('merchant_withdrawals')
        .delete()
        .eq('id', withdrawalId);
      if (decErr.message?.includes('insufficient')) {
        throw new BadRequestException(decErr.message);
      }
      throw new UnprocessableEntityException(
        `Wallet debit failed: ${decErr.message}`,
      );
    }

    return {
      withdrawal_id: withdrawalId,
      amount,
      status: wdRow.status as string,
      admin_approved: wdRow.admin_approved as boolean,
    };
  }

  /** OTP gate — Termii to merchant business_phone; pin_id stored per withdrawal. */
  async sendWithdrawalOtp(
    merchantId: string,
    withdrawalId: string,
  ): Promise<{ sent: boolean; expiresInSeconds: number }> {
    await this.assertWithdrawalOwned(merchantId, withdrawalId);
    await this.redis.del(`${WD_OTP_FAIL_PREFIX}${withdrawalId}`);

    const { data: merchant, error: mErr } = await this.supabase.db
      .from('merchants')
      .select('business_phone, business_name')
      .eq('id', merchantId)
      .single();

    if (mErr || !merchant) {
      throw new NotFoundException('Merchant not found.');
    }

    const termiiKey = this.config.get('termii.apiKey', { infer: true });
    if (!termiiKey) {
      throw new ServiceUnavailableException('TERMII_API_KEY is not configured.');
    }

    let to: string;
    try {
      to = normalizeNigerianPhoneTo234(merchant.business_phone as string);
    } catch {
      throw new BadRequestException('Merchant business_phone is invalid.');
    }

    const baseUrl = this.config.get('termii.baseUrl', { infer: true });
    const senderId = this.config.get('termii.senderId', { infer: true });

    const body = {
      api_key: termiiKey,
      pin_type: 'NUMERIC',
      message_type: 'NUMERIC',
      to,
      from: senderId,
      channel: 'generic',
      pin_attempts: 3,
      pin_time_to_live: 10,
      pin_length: 6,
      pin_placeholder: '< 123456 >',
      message_text:
        `Your Food Stop withdrawal OTP is < 123456 >. Withdrawal ${withdrawalId.slice(0, 8)}… Valid 10 minutes.`,
    };

    const res = await fetch(`${baseUrl}/api/sms/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      this.logger.error(`Termii OTP send failed: ${JSON.stringify(json)}`);
      throw new UnprocessableEntityException(
        (json.message as string) ?? 'Could not send OTP.',
      );
    }

    const pinId =
      (json.pin_id as string) ?? (json.pinId as string) ?? undefined;
    if (!pinId) {
      throw new UnprocessableEntityException('OTP gateway missing pin_id.');
    }

    await this.redis.set(
      `${WD_OTP_REDIS_PREFIX}${withdrawalId}`,
      JSON.stringify({ pin_id: pinId }),
      'EX',
      600,
    );

    return { sent: true, expiresInSeconds: 600 };
  }

  /** Step 2 — verify OTP, call Paystack recipient + transfer; move withdrawal to processing. */
  async initiatePaystackTransfer(
    merchantId: string,
    withdrawalId: string,
    otp: string,
  ): Promise<{
    withdrawal_id: string;
    paystack_transfer_code: string | null;
    paystack_reference: string | null;
    status: string;
  }> {
    const wd = await this.assertWithdrawalOwned(merchantId, withdrawalId);

    if (wd.status !== 'pending') {
      throw new ConflictException(
        `Withdrawal is not pending (current: ${wd.status}).`,
      );
    }
    if (!wd.admin_approved) {
      throw new BadRequestException(
        'This withdrawal requires admin approval before payout.',
      );
    }

    await this.verifyWithdrawalOtp(withdrawalId, otp);

    return this.executePaystackTransfer(wd);
  }

  /**
   * Super / system batch: initiate Paystack transfer without merchant OTP.
   * Withdrawal must be pending, admin-approved, and not already have a transfer code.
   */
  async processWithdrawalSystemById(withdrawalId: string): Promise<{
    ok: boolean;
    withdrawal_id: string;
    skipped?: boolean;
    error?: string;
    paystack_transfer_code?: string | null;
    status?: string;
  }> {
    const { data: wd, error } = await this.supabase.db
      .from('merchant_withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .maybeSingle();

    if (error || !wd) {
      return {
        ok: false,
        withdrawal_id: withdrawalId,
        error: error?.message ?? 'Withdrawal not found.',
      };
    }

    const row = wd as Record<string, unknown>;
    if (row.status !== 'pending') {
      return {
        ok: false,
        withdrawal_id: withdrawalId,
        skipped: true,
        error: `Not pending (status=${String(row.status)}).`,
      };
    }
    if (!row.admin_approved) {
      return {
        ok: false,
        withdrawal_id: withdrawalId,
        error: 'Admin approval required before payout.',
      };
    }
    if (row.paystack_transfer_code) {
      return {
        ok: false,
        withdrawal_id: withdrawalId,
        skipped: true,
        error: 'Transfer already initiated for this withdrawal.',
      };
    }

    try {
      const out = await this.executePaystackTransfer(row);
      return {
        ok: true,
        withdrawal_id: withdrawalId,
        paystack_transfer_code: out.paystack_transfer_code,
        status: out.status,
      };
    } catch (e) {
      let msg = 'Paystack transfer failed.';
      if (e instanceof HttpException) {
        const r = e.getResponse();
        msg =
          typeof r === 'string'
            ? r
            : typeof r === 'object' &&
                r !== null &&
                'message' in r &&
                typeof (r as { message: unknown }).message === 'string'
              ? (r as { message: string }).message
              : e.message;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      this.logger.warn(
        `processWithdrawalSystemById ${withdrawalId}: ${msg}`,
      );
      return {
        ok: false,
        withdrawal_id: withdrawalId,
        error: msg,
      };
    }
  }

  /**
   * Batch-process approved pending withdrawals (Paystack rate limit aware).
   */
  async processBatchWithdrawalsSystem(opts: {
    ids?: string[];
    limit?: number;
    delayMs?: number;
  }): Promise<{
    processed: number;
    failed: number;
    skipped: number;
    results: {
      id: string;
      ok: boolean;
      skipped?: boolean;
      error?: string;
      paystack_transfer_code?: string | null;
    }[];
  }> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
    const delayMs = Math.min(Math.max(opts.delayMs ?? 600, 0), 5000);

    let q = this.supabase.db
      .from('merchant_withdrawals')
      .select('id')
      .eq('status', 'pending')
      .eq('admin_approved', true)
      .is('paystack_transfer_code', null)
      .order('initiated_at', { ascending: true })
      .limit(limit);

    if (opts.ids && opts.ids.length > 0) {
      q = q.in('id', opts.ids.slice(0, 100));
    }

    const { data: rows, error } = await q;
    if (error) {
      throw new ConflictException(error.message);
    }

    const ids = (rows ?? []).map((r) => r.id as string);
    const results: {
      id: string;
      ok: boolean;
      skipped?: boolean;
      error?: string;
      paystack_transfer_code?: string | null;
    }[] = [];

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const r = await this.processWithdrawalSystemById(id);
      if (r.ok) {
        processed += 1;
        results.push({
          id,
          ok: true,
          paystack_transfer_code: r.paystack_transfer_code ?? null,
        });
      } else if (r.skipped) {
        skipped += 1;
        results.push({
          id,
          ok: false,
          skipped: true,
          error: r.error,
        });
      } else {
        failed += 1;
        results.push({ id, ok: false, error: r.error });
      }

      if (i < ids.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    this.logger.log(
      `batch withdrawals: processed=${processed} failed=${failed} skipped=${skipped}`,
    );

    return { processed, failed, skipped, results };
  }

  private async executePaystackTransfer(wd: Record<string, unknown>): Promise<{
    withdrawal_id: string;
    paystack_transfer_code: string | null;
    paystack_reference: string | null;
    status: string;
  }> {
    const merchantId = wd.merchant_id as string;
    const withdrawalId = wd.id as string;

    const paystackSecret = this.config.get('paystack.secretKey', {
      infer: true,
    });
    if (!paystackSecret) {
      throw new ServiceUnavailableException('PAYSTACK_SECRET_KEY missing.');
    }

    let recipientCode = wd.paystack_recipient_code as string | null;

    if (!recipientCode) {
      const recRes = await fetch(
        'https://api.paystack.co/transferrecipient',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'nuban',
            name: wd.account_name,
            account_number: wd.account_number,
            bank_code: wd.bank_code,
            currency: 'NGN',
          }),
        },
      );

      const recJson = (await recRes.json()) as {
        status?: boolean;
        message?: string;
        data?: { recipient_code?: string };
      };

      if (!recRes.ok || !recJson.status || !recJson.data?.recipient_code) {
        throw new UnprocessableEntityException(
          recJson.message ?? 'Paystack could not create transfer recipient.',
        );
      }

      recipientCode = recJson.data.recipient_code;

      await this.supabase.db
        .from('merchant_bank_accounts')
        .update({ paystack_recipient_code: recipientCode })
        .eq('merchant_id', merchantId)
        .eq('account_number', wd.account_number)
        .eq('bank_code', wd.bank_code);
    }

    const reference = `CHOPWD-${withdrawalId.replace(/-/g, '')}`.slice(0, 100);
    const amountKobo = Math.round(Number(wd.amount) * 100);

    const tfRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountKobo,
        recipient: recipientCode,
        reason: `Food Stop merchant payout ${withdrawalId}`,
        reference,
      }),
    });

    const tfJson = (await tfRes.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        transfer_code?: string;
        reference?: string;
      };
    };

    if (!tfRes.ok || !tfJson.status || !tfJson.data?.transfer_code) {
      this.logger.error(`Paystack transfer failed: ${JSON.stringify(tfJson)}`);
      const reason = tfJson.message ?? 'Paystack transfer initiation failed';
      await this.restoreBalanceAfterFailure(
        merchantId,
        withdrawalId,
        Number(wd.amount),
        reason,
      );
      await this.supabase.db
        .from('merchant_withdrawals')
        .update({
          status: 'failed',
          failure_reason: reason,
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);
      throw new UnprocessableEntityException(
        tfJson.message ?? 'Paystack transfer failed — balance restored.',
      );
    }

    await this.supabase.db
      .from('merchant_withdrawals')
      .update({
        otp_verified: true,
        status: 'processing',
        paystack_recipient_code: recipientCode,
        paystack_transfer_code: tfJson.data.transfer_code,
        paystack_transfer_ref: tfJson.data.reference ?? reference,
      })
      .eq('id', withdrawalId);

    await this.notifications.notify(merchantId, {
      type: 'withdrawal_processing',
      title: 'Withdrawal initiated',
      body: `Your payout of ₦${Number(wd.amount).toLocaleString('en-NG')} is processing.`,
      data: {
        withdrawalId,
        transferCode: tfJson.data.transfer_code,
      },
    });

    return {
      withdrawal_id: withdrawalId,
      paystack_transfer_code: tfJson.data.transfer_code ?? null,
      paystack_reference: tfJson.data.reference ?? reference,
      status: 'processing',
    };
  }

  async listWithdrawals(
    merchantId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: unknown[]; limit: number; offset: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const { data, error } = await this.supabase.db
      .from('merchant_withdrawals')
      .select(
        'id, amount, bank_name, bank_code, account_number, account_name, status, failure_reason, admin_approved, otp_verified, paystack_transfer_code, paystack_transfer_ref, initiated_at, processed_at',
      )
      .eq('merchant_id', merchantId)
      .order('initiated_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (error) {
      throw new ConflictException(error.message);
    }

    return { items: data ?? [], limit: safeLimit, offset: safeOffset };
  }

  async getWithdrawalDetail(
    merchantId: string,
    withdrawalId: string,
  ): Promise<Record<string, unknown>> {
    return this.assertWithdrawalOwned(merchantId, withdrawalId);
  }

  async handleTransferSuccess(params: {
    transferCode: string;
    reference?: string;
  }): Promise<void> {
    const { data: wd } = await this.supabase.db
      .from('merchant_withdrawals')
      .select('*')
      .eq('paystack_transfer_code', params.transferCode)
      .maybeSingle();

    if (!wd) {
      this.logger.warn(
        `transfer.success: no withdrawal for code=${params.transferCode}`,
      );
      return;
    }

    if (wd.status === 'completed') {
      return;
    }

    await this.supabase.db
      .from('merchant_withdrawals')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq('id', wd.id);

    await this.supabase.db
      .from('merchant_wallet_transactions')
      .update({ status: 'completed' })
      .eq('withdrawal_id', wd.id)
      .eq('type', 'withdrawal')
      .eq('status', 'pending');

    await this.notifications.notify(wd.merchant_id as string, {
      type: 'withdrawal_completed',
      title: 'Payout completed',
      body: `₦${Number(wd.amount).toLocaleString('en-NG')} sent to your ${wd.bank_name} account.`,
      data: { withdrawalId: wd.id, reference: params.reference },
    });
  }

  async handleTransferFailed(params: {
    transferCode: string;
    reason: string;
  }): Promise<void> {
    const { data: wd } = await this.supabase.db
      .from('merchant_withdrawals')
      .select('*')
      .eq('paystack_transfer_code', params.transferCode)
      .maybeSingle();

    if (!wd) {
      this.logger.warn(
        `transfer.failed: no withdrawal for code=${params.transferCode}`,
      );
      return;
    }

    if (wd.status === 'failed' || wd.status === 'completed') {
      return;
    }

    await this.restoreBalanceAfterFailure(
      wd.merchant_id as string,
      wd.id as string,
      Number(wd.amount),
      params.reason,
    );

    await this.supabase.db
      .from('merchant_withdrawals')
      .update({
        status: 'failed',
        failure_reason: params.reason,
        processed_at: new Date().toISOString(),
      })
      .eq('id', wd.id);

    await this.notifications.notify(wd.merchant_id as string, {
      type: 'withdrawal_failed',
      title: 'Payout failed — balance restored',
      body: `${params.reason}. Your wallet has been credited back.`,
      data: { withdrawalId: wd.id },
    });
  }

  private async restoreBalanceAfterFailure(
    merchantId: string,
    withdrawalId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const { error } = await this.supabase.db.rpc(
      'merchant_wallet_restore_failed_withdrawal',
      {
        p_merchant_id: merchantId,
        p_withdrawal_id: withdrawalId,
        p_amount: amount,
        p_reason: reason,
      },
    );

    if (error) {
      this.logger.error(
        `CRITICAL: restore RPC failed for withdrawal ${withdrawalId}: ${error.message}`,
      );
      throw error;
    }
  }

  private async verifyWithdrawalOtp(
    withdrawalId: string,
    otp: string,
  ): Promise<void> {
    const bypass = this.config.get('withdrawal.otpBypassCode', { infer: true });
    const nodeEnv = this.config.get('nodeEnv', { infer: true });
    if (
      nodeEnv === 'development' &&
      bypass &&
      bypass.length === 6 &&
      otp === bypass
    ) {
      this.logger.warn(
        'Withdrawal OTP bypass used (MERCHANT_WITHDRAWAL_OTP_BYPASS).',
      );
      return;
    }

    const raw = await this.redis.get(`${WD_OTP_REDIS_PREFIX}${withdrawalId}`);
    if (!raw) {
      throw new BadRequestException(
        'OTP session expired — request a new code via send-otp.',
      );
    }

    const failKey = `${WD_OTP_FAIL_PREFIX}${withdrawalId}`;
    const failCount = Number((await this.redis.get(failKey)) ?? 0);
    if (failCount >= 3) {
      throw new BadRequestException(
        'Too many incorrect OTP attempts for this withdrawal. Request a new code via send-otp.',
      );
    }

    const { pin_id: pinId } = JSON.parse(raw) as { pin_id: string };
    const termiiKey = this.config.get('termii.apiKey', { infer: true });
    if (!termiiKey) {
      throw new ServiceUnavailableException('TERMII_API_KEY missing.');
    }

    const baseUrl = this.config.get('termii.baseUrl', { infer: true });

    const res = await fetch(`${baseUrl}/api/sms/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: termiiKey,
        pin_id: pinId,
        pin: otp,
      }),
    });

    const json = (await res.json()) as Record<string, unknown>;
    const verified =
      json.verified === true ||
      (json as { data?: { verified?: boolean } }).data?.verified === true;

    if (!res.ok || !verified) {
      const n = await this.redis.incr(failKey);
      if (n === 1) {
        await this.redis.expire(failKey, 600);
      }
      throw new BadRequestException('Invalid or expired OTP.');
    }

    await this.redis.del(`${WD_OTP_REDIS_PREFIX}${withdrawalId}`);
    await this.redis.del(failKey);

    await this.supabase.db
      .from('merchant_withdrawals')
      .update({ otp_verified: true })
      .eq('id', withdrawalId);
  }

  private async assertWithdrawalOwned(
    merchantId: string,
    withdrawalId: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.db
      .from('merchant_withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .eq('merchant_id', merchantId)
      .single();

    if (error || !data) {
      throw new ForbiddenException('Withdrawal not found.');
    }
    return data as Record<string, unknown>;
  }
}
