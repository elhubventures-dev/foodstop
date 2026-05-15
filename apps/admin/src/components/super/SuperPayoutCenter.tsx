'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from './superPayoutCenter.module.css';

type WdRow = {
  id: string;
  merchant_id: string;
  amount: number | string;
  status: string;
  admin_approved: boolean | null;
  paystack_transfer_code: string | null;
  initiated_at: string | null;
  bank_name: string;
  account_number: string;
  account_name: string;
  failure_reason: string | null;
  merchants: { business_name: string; slug: string } | { business_name: string; slug: string }[] | null;
};

function fmtNgn(n: number | string | null | undefined): string {
  const v = Number(n);
  if (Number.isNaN(v)) return '₦0';
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function merchantName(row: WdRow): string {
  const m = row.merchants;
  if (!m) return '—';
  const one = Array.isArray(m) ? m[0] : m;
  return one?.business_name ?? '—';
}

async function staffFetch<T extends Record<string, unknown> = { error?: string; ok?: boolean }>(
  path: string,
  body: object,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Sign in required.');
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function SuperPayoutCenter() {
  const [rows, setRows] = useState<WdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('merchant_withdrawals')
      .select(
        `id, merchant_id, amount, status, admin_approved, paystack_transfer_code, initiated_at, bank_name, account_number, account_name, failure_reason,
         merchants ( business_name, slug )`,
      )
      .eq('status', 'pending')
      .order('initiated_at', { ascending: false })
      .limit(500);

    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as WdRow[]);
    }
    setLoading(false);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const needsApproval = useMemo(
    () => rows.filter((r) => !r.admin_approved),
    [rows],
  );

  const eligiblePaystackBatch = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.admin_approved &&
          r.status === 'pending' &&
          (r.paystack_transfer_code == null || r.paystack_transfer_code === ''),
      ),
    [rows],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllNeeding = () => {
    setSelected(new Set(needsApproval.map((r) => r.id)));
  };

  const bulkApprove = async () => {
    const ids = [...selected].filter((id) => {
      const r = rows.find((x) => x.id === id);
      return r && !r.admin_approved;
    });
    if (ids.length === 0) return;
    setBusy(true);
    setActionErr(null);
    try {
      await staffFetch('/api/super/withdrawals/approve', { ids });
      await load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  };

  const submitReject = async () => {
    if (!rejectId) return;
    const reason = rejectNote.trim();
    if (reason.length < 8) {
      setActionErr('Enter a clear reason (min 8 characters).');
      return;
    }
    setBusy(true);
    setActionErr(null);
    try {
      await staffFetch('/api/super/withdrawals/reject', { id: rejectId, reason });
      setRejectId(null);
      setRejectNote('');
      await load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setBusy(false);
    }
  };

  const batchPaystack = async () => {
    if (eligiblePaystackBatch.length === 0) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Initiate Paystack transfers for up to 50 approved withdrawals in queue order (${eligiblePaystackBatch.length} eligible in this view)? This skips merchant SMS OTP and requires CHOPFAST_API_URL + CHOPFAST_INTERNAL_API_KEY.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setActionErr(null);
    setBatchSummary(null);
    try {
      const out = await staffFetch<{
        processed: number;
        failed: number;
        skipped: number;
        results?: { id: string; ok: boolean; error?: string }[];
      }>('/api/super/withdrawals/batch-process', { limit: 50, delayMs: 600 });
      setBatchSummary(
        `Batch complete: processed ${out.processed}, failed ${out.failed}, skipped ${out.skipped}.`,
      );
      await load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Batch failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Payout management</h1>
        <p className={styles.sub}>
          Pending merchant withdrawals. Approve lets the merchant complete SMS OTP and Paystack transfer,
          or use <strong>Run Paystack batch</strong> to initiate transfers from the API for approved rows
          (skips OTP; uses Paystack on the server). Reject restores their wallet via the ledger RPC (requires{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> on this app).
        </p>
      </header>

      <div className={styles.toolbar}>
        <button type="button" className={styles.btn} onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Refresh
        </button>
        <button type="button" className={styles.btn} onClick={selectAllNeeding} disabled={loading || needsApproval.length === 0}>
          Select all needing approval
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => void bulkApprove()}
          disabled={busy || selected.size === 0}
        >
          <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Approve selected ({selected.size})
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => void batchPaystack()}
          disabled={busy || eligiblePaystackBatch.length === 0}
          title="Calls ChopFast API internal batch (max 50, 600ms spacing)"
        >
          <Zap size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Run Paystack batch ({eligiblePaystackBatch.length} eligible)
        </button>
      </div>

      {batchSummary && <p className={styles.rowMuted}>{batchSummary}</p>}
      {actionErr && <p className={styles.err}>{actionErr}</p>}

      {loading ? (
        <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="animate-spin" size={20} /> Loading…
        </p>
      ) : err ? (
        <p className={styles.err}>{err}</p>
      ) : rows.length === 0 ? (
        <p className={styles.rowMuted}>No pending withdrawals.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 36 }} />
                <th>Merchant</th>
                <th>Amount</th>
                <th>Bank / account</th>
                <th>Admin approved</th>
                <th>Paystack</th>
                <th>Requested</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {!r.admin_approved ? (
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                        aria-label={`Select withdrawal ${r.id}`}
                      />
                    ) : null}
                  </td>
                  <td>
                    <strong>{merchantName(r)}</strong>
                    <div className={styles.rowMuted} style={{ fontSize: '0.75rem' }}>
                      {r.merchant_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td>{fmtNgn(r.amount)}</td>
                  <td>
                    {r.bank_name}
                    <div className={styles.rowMuted}>
                      {r.account_name} · …{String(r.account_number).slice(-4)}
                    </div>
                  </td>
                  <td>
                    {r.admin_approved ? (
                      <span className={styles.badgeOk}>Yes</span>
                    ) : (
                      <span className={styles.badgeNo}>No</span>
                    )}
                  </td>
                  <td className={styles.rowMuted} style={{ fontSize: '0.8rem' }}>
                    {r.paystack_transfer_code ? (
                      <span className={styles.badgeOk} title={r.paystack_transfer_code}>
                        Initiated
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={styles.rowMuted}>
                    {r.initiated_at ? new Date(r.initiated_at).toLocaleString('en-NG') : '—'}
                  </td>
                  <td>
                    {!r.admin_approved ? (
                      <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => {
                        setActionErr(null);
                        setRejectId(r.id);
                      }}
                      disabled={busy}
                    >
                        <XCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        Reject
                      </button>
                    ) : r.paystack_transfer_code ? (
                      <span className={styles.rowMuted}>Transfer started</span>
                    ) : (
                      <span className={styles.rowMuted}>Awaiting merchant OTP or batch</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectId && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => !busy && setRejectId(null)}
        >
          <div className={styles.modal} role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Reject withdrawal</h3>
            <p className={styles.rowMuted} style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
              Wallet balance will be restored for the merchant. This cannot be undone from here if they
              already completed payout (check status first).
            </p>
            <textarea
              className={styles.textarea}
              placeholder="Reason shown internally / to merchant (min 8 chars)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            {actionErr && <p className={styles.err}>{actionErr}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className={styles.btn} onClick={() => setRejectId(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className={styles.btnDanger} onClick={() => void submitReject()} disabled={busy}>
                {busy ? 'Working…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
