import { ConflictException, Injectable } from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';

const round2 = (n: number): number => Math.round(n * 100) / 100;

@Injectable()
export class WalletService {
  constructor(private readonly supabase: SupabaseService) {}

  async getWalletSummary(merchantId: string): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.db
      .from('merchant_wallets')
      .select(
        'merchant_id, currency, available_balance, pending_balance, total_earned, total_withdrawn, total_commission_paid, updated_at',
      )
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (error) {
      throw new ConflictException(error.message);
    }

    if (!data) {
      return {
        merchant_id: merchantId,
        currency: 'NGN',
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        total_commission_paid: 0,
        wallet_initialized: false,
      };
    }

    return {
      ...data,
      available_balance: round2(Number(data.available_balance)),
      pending_balance: round2(Number(data.pending_balance)),
      total_earned: round2(Number(data.total_earned)),
      total_withdrawn: round2(Number(data.total_withdrawn)),
      total_commission_paid: round2(Number(data.total_commission_paid)),
      wallet_initialized: true,
    };
  }

  async listTransactions(
    merchantId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: unknown[]; limit: number; offset: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const { data, error } = await this.supabase.db
      .from('merchant_wallet_transactions')
      .select(
        'id, type, amount, commission_amount, net_amount, reference, order_id, withdrawal_id, description, status, created_at',
      )
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (error) {
      throw new ConflictException(error.message);
    }

    return { items: data ?? [], limit: safeLimit, offset: safeOffset };
  }

  async listBankAccounts(merchantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.db
      .from('merchant_bank_accounts')
      .select(
        'id, bank_name, bank_code, account_number, account_name, is_default, is_verified, paystack_recipient_code, created_at',
      )
      .eq('merchant_id', merchantId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }
}
