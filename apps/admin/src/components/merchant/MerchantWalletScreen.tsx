'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Clock,
  TrendingUp,
  ArrowDownLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@chopfast/shared';
import { merchantApiGet, merchantApiPost } from '@/lib/merchantApi';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import styles from './merchantWallet.module.css';

const MIN_WITHDRAW_NGN = 1000;
const ADMIN_THRESHOLD_NGN = Number(
  process.env.NEXT_PUBLIC_WITHDRAWAL_ADMIN_THRESHOLD_NGN ?? 500_000,
);

const TX_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'commission', label: 'Commission' },
  { value: 'refund_deduction', label: 'Refund' },
  { value: 'manual_credit', label: 'Manual credit' },
  { value: 'manual_debit', label: 'Manual debit' },
];

const TX_STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' },
];

function fmtNgn(n: number | string | null | undefined): string {
  const v = Number(n);
  if (Number.isNaN(v)) return '₦0';
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function maskAccount(n: string | undefined): string {
  if (!n || n.length < 4) return '••••';
  return `••••${n.slice(-4)}`;
}

export type MerchantWalletScreenProps = {
  /** Optional override; defaults to signed-in merchant from context. */
  merchantId?: string;
};

type WalletRow = {
  merchant_id: string;
  available_balance: number | string;
  pending_balance: number | string;
  total_earned: number | string;
  total_withdrawn: number | string;
  total_commission_paid: number | string;
};

type WalletTx = {
  id: string;
  merchant_id: string;
  type: string;
  amount: number | string;
  commission_amount: number | string | null;
  net_amount: number | string;
  reference: string | null;
  order_id: string | null;
  withdrawal_id: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

type BankRow = {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean | null;
  is_verified: boolean | null;
};

type WithdrawRequestRes = {
  withdrawal_id: string;
  amount: number;
  status: string;
  admin_approved: boolean;
};

export function MerchantWalletScreen({
  merchantId: merchantIdProp,
}: MerchantWalletScreenProps) {
  const { session, accessToken } = useMerchantAuth();
  const merchantId = merchantIdProp ?? session?.merchant.id ?? '';

  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [otpSmsSent, setOtpSmsSent] = useState(false);

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'admin_wait' | 'success'>('form');
  const [amountStr, setAmountStr] = useState('');
  const [bankId, setBankId] = useState('');
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(null);
    if (!merchantId) {
      setWallet(null);
      setTxs([]);
      setBanks([]);
      return;
    }

    if (accessToken) {
      try {
        const [wRaw, txWrap, b] = await Promise.all([
          merchantApiGet<WalletRow & { wallet_initialized?: boolean }>(
            '/merchant/wallet',
            accessToken,
          ),
          merchantApiGet<{ items: WalletTx[] }>(
            '/merchant/wallet/transactions?limit=400&offset=0',
            accessToken,
          ),
          merchantApiGet<BankRow[]>('/merchant/bank-accounts', accessToken),
        ]);
        setWallet({
          merchant_id: (wRaw.merchant_id as string) ?? merchantId,
          available_balance: wRaw.available_balance,
          pending_balance: wRaw.pending_balance,
          total_earned: wRaw.total_earned,
          total_withdrawn: wRaw.total_withdrawn,
          total_commission_paid: wRaw.total_commission_paid,
        });
        const txList = Array.isArray(txWrap) ? (txWrap as WalletTx[]) : txWrap.items ?? [];
        setTxs(txList);
        setBanks(Array.isArray(b) ? b : []);
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : 'Failed to load wallet');
      }
      return;
    }

    const [{ data: w, error: wErr }, { data: t, error: tErr }, { data: b, error: bErr }] =
      await Promise.all([
        supabase
          .from('merchant_wallets')
          .select(
            'merchant_id, available_balance, pending_balance, total_earned, total_withdrawn, total_commission_paid',
          )
          .eq('merchant_id', merchantId)
          .maybeSingle(),
        supabase
          .from('merchant_wallet_transactions')
          .select(
            'id, merchant_id, type, amount, commission_amount, net_amount, reference, order_id, withdrawal_id, description, status, created_at',
          )
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .limit(400),
        supabase
          .from('merchant_bank_accounts')
          .select(
            'id, bank_name, bank_code, account_number, account_name, is_default, is_verified',
          )
          .eq('merchant_id', merchantId)
          .order('is_default', { ascending: false }),
      ]);

    if (wErr) setLoadErr(wErr.message);
    else if (w) setWallet(w as WalletRow);
    else setWallet(null);

    if (!tErr && t) setTxs(t as WalletTx[]);
    if (!bErr && b) setBanks(b as BankRow[]);
    if (tErr && !wErr) setLoadErr(tErr.message);
  }, [merchantId, accessToken]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const verifiedBanks = useMemo(
    () => banks.filter((b) => b.is_verified === true),
    [banks],
  );

  useEffect(() => {
    if (!bankId && verifiedBanks.length > 0) {
      const def = verifiedBanks.find((b) => b.is_default) ?? verifiedBanks[0];
      setBankId(def.id);
    }
  }, [verifiedBanks, bankId]);

  const filteredTxs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txs.filter((row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (q) {
        const blob = [
          row.reference,
          row.description,
          row.type,
          row.status,
          row.order_id,
          row.withdrawal_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [txs, typeFilter, statusFilter, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openModal = () => {
    setStep('form');
    setAmountStr('');
    setOtp('');
    setSubmitErr(null);
    setWithdrawalId(null);
    setOtpSmsSent(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setModalOpen(false);
  };

  const requestWithdrawal = async () => {
    if (!accessToken) {
      setSubmitErr('Sign in to the merchant portal to withdraw.');
      return;
    }
    const amount = Math.round(Number(amountStr) * 100) / 100;
    if (!Number.isFinite(amount) || amount < MIN_WITHDRAW_NGN) {
      setSubmitErr(`Minimum withdrawal is ${fmtNgn(MIN_WITHDRAW_NGN)}.`);
      return;
    }
    const available = Number(wallet?.available_balance ?? 0);
    if (amount > available) {
      setSubmitErr('Amount exceeds available balance.');
      return;
    }
    if (!bankId) {
      setSubmitErr('Select a verified bank account.');
      return;
    }
    setBusy(true);
    setSubmitErr(null);
    try {
      const res = await merchantApiPost<WithdrawRequestRes>(
        '/merchant/withdrawals',
        accessToken,
        { bank_account_id: bankId, amount },
      );
      setWithdrawalId(res.withdrawal_id);
      setOtpSmsSent(false);
      if (!res.admin_approved) {
        setStep('admin_wait');
      } else {
        setStep('otp');
      }
      await load();
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = useCallback(async (): Promise<boolean> => {
    if (!accessToken || !withdrawalId) return false;
    setBusy(true);
    setSubmitErr(null);
    try {
      await merchantApiPost<{ sent: boolean; expiresInSeconds: number }>(
        `/merchant/withdrawals/${withdrawalId}/send-otp`,
        accessToken,
      );
      return true;
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Could not send OTP');
      return false;
    } finally {
      setBusy(false);
    }
  }, [accessToken, withdrawalId]);

  const confirmOtp = async () => {
    if (!accessToken || !withdrawalId) return;
    if (!/^\d{6}$/.test(otp)) {
      setSubmitErr('Enter the 6-digit code from SMS.');
      return;
    }
    setBusy(true);
    setSubmitErr(null);
    try {
      await merchantApiPost(
        `/merchant/withdrawals/${withdrawalId}/initiate`,
        accessToken,
        { otp },
      );
      setStep('success');
      await load();
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const available = Number(wallet?.available_balance ?? 0);
  const pending = Number(wallet?.pending_balance ?? 0);
  const earned = Number(wallet?.total_earned ?? 0);
  const withdrawn = Number(wallet?.total_withdrawn ?? 0);

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <Loader2 className={styles.spin} size={28} />
          <p>Loading wallet…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className={styles.title}>Wallet</h1>
            <p className={styles.sub}>
              Available and pending balances, full ledger, and Paystack withdrawals
              with SMS OTP (Termii).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" className={styles.btnGhost} onClick={onRefresh} disabled={refreshing}>
              <RefreshCw
                size={16}
                className={refreshing ? styles.spin : undefined}
                style={{ verticalAlign: 'middle', marginRight: 6 }}
              />
              Refresh
            </button>
            <button type="button" className={styles.btnPrimary} onClick={openModal}>
              <ArrowDownLeft size={18} />
              Withdraw
            </button>
          </div>
        </div>
      </header>

      {!accessToken && (
        <div className={`${styles.banner} ${styles.bannerWarn}`}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Sign in at <strong>/merchant/login</strong> to load balances from the API and use
            withdrawals. Without a session, this screen falls back to Supabase reads when a
            merchant ID is provided.
          </span>
        </div>
      )}

      {loadErr && (
        <div className={styles.banner} style={{ borderColor: 'rgba(239,68,68,0.35)', color: 'var(--color-error)' }}>
          {loadErr}
        </div>
      )}

      <div className={styles.balanceGrid}>
        <div className={`${styles.balanceCard} ${styles.highlight}`}>
          <div className={styles.balanceLabel}>Available</div>
          <div className={styles.balanceValue}>{fmtNgn(available)}</div>
          <div className={styles.balanceHint}>Ready to withdraw</div>
        </div>
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Pending</div>
          <div className={styles.balanceValue}>{fmtNgn(pending)}</div>
          <div className={styles.balanceHint}>
            <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Held until release window / no open dispute
          </div>
        </div>
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Total earned</div>
          <div className={styles.balanceValue}>{fmtNgn(earned)}</div>
          <div className={styles.balanceHint}>Gross credited to wallet (lifetime)</div>
        </div>
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Total withdrawn</div>
          <div className={styles.balanceValue}>{fmtNgn(withdrawn)}</div>
          <div className={styles.balanceHint}>
            <TrendingUp size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Payouts initiated
          </div>
        </div>
      </div>

      <section style={{ marginTop: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <Wallet size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 8 }} />
          Transaction ledger
        </h2>

        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            <label htmlFor="tx-type">Type</label>
            <select
              id="tx-type"
              className={styles.select}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TX_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="tx-status">Status</label>
            <select
              id="tx-status"
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {TX_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup} style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="tx-search">Search</label>
            <input
              id="tx-search"
              className={styles.input}
              style={{ minWidth: 180, flex: 1 }}
              placeholder="Reference, description, order…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {new Date(row.created_at).toLocaleString('en-NG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>{row.type}</td>
                    <td>
                      <div>{row.description ?? '—'}</div>
                      {row.reference && (
                        <div className={styles.mono}>{row.reference}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtNgn(row.net_amount)}</td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          row.status === 'completed'
                            ? styles.statusOk
                            : row.status === 'pending'
                              ? styles.statusPending
                              : row.status === 'reversed'
                                ? styles.statusErr
                                : row.status === 'failed'
                                  ? styles.statusErr
                                  : styles.statusPending
                        }`}
                      >
                        {row.status === 'completed' && <CheckCircle2 size={14} />}
                        {row.status === 'pending' && <Clock size={14} />}
                        {(row.status === 'failed' || row.status === 'reversed') && (
                          <XCircle size={14} />
                        )}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          Showing {filteredTxs.length} of {txs.length} loaded rows (newest first).
        </p>
      </section>

      {modalOpen && (
        <div className={styles.modalOverlay} role="presentation" onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wd-title"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'form' && (
              <>
                <h3 id="wd-title">Withdraw to bank</h3>
                <p>
                  Minimum {fmtNgn(MIN_WITHDRAW_NGN)}. Amounts {fmtNgn(ADMIN_THRESHOLD_NGN)} or more require
                  platform approval before OTP and transfer.
                </p>
                {verifiedBanks.length === 0 ? (
                  <p className={styles.err}>
                    No verified bank account on file. Complete onboarding and verify a
                    payout account first.
                  </p>
                ) : (
                  <>
                    <div className={styles.field}>
                      <label htmlFor="wd-amt">Amount (NGN)</label>
                      <input
                        id="wd-amt"
                        type="number"
                        min={MIN_WITHDRAW_NGN}
                        step="0.01"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        placeholder="e.g. 50000"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="wd-bank">Bank account</label>
                      <select
                        id="wd-bank"
                        value={bankId}
                        onChange={(e) => setBankId(e.target.value)}
                      >
                        {verifiedBanks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bank_name} · {maskAccount(b.account_number)} · {b.account_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {submitErr && <p className={styles.err}>{submitErr}</p>}
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnGhost} onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={busy || verifiedBanks.length === 0}
                    onClick={requestWithdrawal}
                  >
                    {busy ? '…' : 'Continue'}
                  </button>
                </div>
              </>
            )}

            {step === 'admin_wait' && (
              <>
                <h3 id="wd-title">Awaiting approval</h3>
                <p>
                  Your withdrawal request was recorded and your available balance was
                  debited. Because the amount is {fmtNgn(ADMIN_THRESHOLD_NGN)} or above,
                  a platform admin must approve it before you can confirm with OTP and
                  send the transfer.
                </p>
                <p className={styles.mono} style={{ fontSize: '0.8rem' }}>
                  Withdrawal ID: {withdrawalId}
                </p>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnPrimary} onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            )}

            {step === 'otp' && (
              <>
                <h3 id="wd-title">Confirm with OTP</h3>
                <p>
                  Send a one-time code to your registered business phone (Termii), then
                  enter the 6 digits. Codes expire in about 10 minutes.
                </p>
                {!otpSmsSent ? (
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      disabled={busy}
                      onClick={async () => {
                        const ok = await sendOtp();
                        if (ok) setOtpSmsSent(true);
                      }}
                    >
                      {busy ? 'Sending…' : 'Send SMS code'}
                    </button>
                  </div>
                ) : (
                  <div className={styles.field}>
                    <label htmlFor="wd-otp">SMS code</label>
                    <input
                      id="wd-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="000000"
                    />
                  </div>
                )}
                {submitErr && <p className={styles.err}>{submitErr}</p>}
                <div className={styles.modalActions} style={{ justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={() => void sendOtp()}
                    disabled={busy || !otpSmsSent}
                  >
                    Resend SMS
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className={styles.btnGhost} onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      disabled={busy || !otpSmsSent}
                      onClick={confirmOtp}
                    >
                      {busy ? '…' : 'Verify & pay out'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'success' && (
              <>
                <h3 id="wd-title">Withdrawal initiated</h3>
                <p className={styles.success}>
                  OTP verified and Paystack transfer started. You will see status updates
                  in your ledger when the transfer completes or fails (balance restores on
                  failure).
                </p>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnPrimary} onClick={closeModal}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
