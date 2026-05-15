'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { supabase, fetchPlatformFeatureFlags, isFeatureOn } from '@chopfast/shared';
import styles from './platformFinancials.module.css';

type RangePreset = '30d' | '90d' | 'ytd' | 'all';

function startIsoForPreset(preset: RangePreset): string | null {
  const now = new Date();
  if (preset === 'all') return null;
  if (preset === '30d') {
    return new Date(now.getTime() - 30 * 86400000).toISOString();
  }
  if (preset === '90d') {
    return new Date(now.getTime() - 90 * 86400000).toISOString();
  }
  return new Date(now.getFullYear(), 0, 1).toISOString();
}

function fmtNgn(n: number): string {
  if (!Number.isFinite(n)) return '₦0';
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function csvEscape(s: string | number | null | undefined): string {
  const v = s == null ? '' : String(s);
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

type LedgerRow = {
  id: string;
  order_id: string;
  merchant_id: string;
  order_grand_total: number | string | null;
  food_subtotal: number | string;
  commission_amount: number | string;
  vat_amount: number | string | null;
  merchant_net: number | string;
  created_at: string;
  business_name?: string;
};

type OrderRow = {
  id: string;
  total: number | string;
  status: string;
  created_at: string;
};

type WithdrawalRow = {
  amount: number | string;
  status: string;
  processed_at: string | null;
  initiated_at: string | null;
};

export function PlatformFinancialsDashboard() {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [vatRemittanceOn, setVatRemittanceOn] = useState(false);
  const [filingBusy, setFilingBusy] = useState(false);
  const [filingMsg, setFilingMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);

  const startIso = useMemo(() => startIsoForPreset(preset), [preset]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const start = startIsoForPreset(preset);

    let ledgerQ = supabase
      .from('platform_commission_ledger')
      .select(
        'id, order_id, merchant_id, order_grand_total, food_subtotal, commission_amount, vat_amount, merchant_net, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(5000);

    let ordersQ = supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(8000);

    let wdQ = supabase
      .from('merchant_withdrawals')
      .select('amount, status, processed_at, initiated_at')
      .in('status', ['completed', 'processing'])
      .order('initiated_at', { ascending: false })
      .limit(5000);

    if (start) {
      ledgerQ = ledgerQ.gte('created_at', start);
      ordersQ = ordersQ.gte('created_at', start);
      wdQ = wdQ.gte('initiated_at', start);
    }

    const [lr, or, wr] = await Promise.all([ledgerQ, ordersQ, wdQ]);

    let ledgerRows = (lr.data ?? []) as LedgerRow[];
    if (!lr.error && ledgerRows.length > 0) {
      const ids = [...new Set(ledgerRows.map((r) => r.merchant_id))];
      const { data: merchants } = await supabase
        .from('merchants')
        .select('id, business_name')
        .in('id', ids);
      const nameBy = new Map((merchants ?? []).map((m) => [m.id as string, m.business_name as string]));
      ledgerRows = ledgerRows.map((r) => ({
        ...r,
        business_name: nameBy.get(r.merchant_id) ?? undefined,
      }));
    }

    if (lr.error) setErr(lr.error.message);
    else setLedger(ledgerRows);

    if (or.error && !lr.error) setErr(or.error.message);
    else if (!or.error) setOrders((or.data ?? []) as OrderRow[]);

    if (wr.error && !lr.error && !or.error) setErr(wr.error.message);
    else if (!wr.error) setWithdrawals((wr.data ?? []) as WithdrawalRow[]);

    setLoading(false);
  }, [preset]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const flags = await fetchPlatformFeatureFlags(supabase);
      if (!alive) return;
      setVatRemittanceOn(isFeatureOn(flags, 'vat_remittance'));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const gmv = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const commission = ledger.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    const vat = ledger.reduce((s, r) => s + Number(r.vat_amount || 0), 0);
    const payoutVolume = withdrawals
      .filter((w) => w.status === 'completed')
      .reduce((s, w) => s + Number(w.amount || 0), 0);
    const netRevenue = commission + vat;
    return { gmv, commission, vat, payoutVolume, netRevenue };
  }, [orders, ledger, withdrawals]);

  const recordVatFiling = async () => {
    if (!vatRemittanceOn || ledger.length === 0) return;
    setFilingBusy(true);
    setFilingMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const end = new Date().toISOString().slice(0, 10);
      const periodStartIso = startIsoForPreset(preset);
      const start =
        periodStartIso != null
          ? new Date(periodStartIso).toISOString().slice(0, 10)
          : end;
      const vatTotal = ledger.reduce((s, r) => s + Number(r.vat_amount || 0), 0);
      const { error } = await supabase.from('platform_vat_remittance_filings').insert({
        period_start: start,
        period_end: end,
        total_vat_ngn: vatTotal,
        ledger_row_count: ledger.length,
        notes: `Recorded from Super financials dashboard (${preset} view).`,
        filed_by: session?.user?.id ?? null,
      });
      if (error) throw new Error(error.message);
      setFilingMsg('VAT remittance filing row saved (audit trail).');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Filing failed');
    } finally {
      setFilingBusy(false);
    }
  };

  const leaderboard = useMemo(() => {
    const by = new Map<
      string,
      { merchantId: string; name: string; commission: number; food: number }
    >();
    for (const row of ledger) {
      const mid = row.merchant_id;
      const name = row.business_name ?? mid.slice(0, 8);
      const cur = by.get(mid) ?? {
        merchantId: mid,
        name,
        commission: 0,
        food: 0,
      };
      cur.commission += Number(row.commission_amount || 0);
      cur.food += Number(row.food_subtotal || 0);
      cur.name = name;
      by.set(mid, cur);
    }
    const list = [...by.values()].sort((a, b) => b.commission - a.commission);
    const maxC = Math.max(...list.map((x) => x.commission), 1);
    return { list: list.slice(0, 15), maxC };
  }, [ledger]);

  const exportVatCsv = () => {
    const headers = [
      'created_at',
      'order_id',
      'merchant_id',
      'merchant_name',
      'food_subtotal_ngn',
      'vat_amount_ngn',
      'commission_amount_ngn',
      'order_grand_total_ngn',
    ];
    const lines = [headers.join(',')];
    for (const row of ledger) {
      const name = row.business_name ?? '';
      lines.push(
        [
          csvEscape(row.created_at),
          csvEscape(row.order_id),
          csvEscape(row.merchant_id),
          csvEscape(name),
          csvEscape(Number(row.food_subtotal)),
          csvEscape(Number(row.vat_amount ?? 0)),
          csvEscape(Number(row.commission_amount)),
          csvEscape(Number(row.order_grand_total ?? 0)),
        ].join(','),
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chopfast-vat-commission-${preset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rangeLabels: { id: RangePreset; label: string }[] = [
    { id: '30d', label: '30 days' },
    { id: '90d', label: '90 days' },
    { id: 'ytd', label: 'Year to date' },
    { id: 'all', label: 'All time' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform financials</h1>
          <p className={styles.sub}>
            GMV from delivered orders; commission & VAT from the platform ledger;
            payout volume from completed merchant withdrawals.
          </p>
        </div>
        <div className={styles.toolbar}>
          {rangeLabels.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`${styles.rangeBtn} ${preset === r.id ? styles.rangeBtnActive : ''}`}
              onClick={() => setPreset(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {startIso && (
        <p className={styles.hint} style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
          From {new Date(startIso).toLocaleDateString('en-NG')} (ledger & withdrawals
          filtered by row date; GMV uses delivered order date).
        </p>
      )}

      {err && <p className={styles.err}>{err}</p>}

      {loading ? (
        <div className={styles.empty}>
          <Loader2 size={28} className={styles.spin} />
          <p>Loading financial data…</p>
        </div>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>GMV (delivered orders)</div>
              <div className={styles.kpiValue}>{fmtNgn(kpis.gmv)}</div>
              <div className={styles.kpiHint}>Sum of order totals with status delivered.</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Commission collected</div>
              <div className={styles.kpiValue}>{fmtNgn(kpis.commission)}</div>
              <div className={styles.kpiHint}>From platform_commission_ledger (post-delivery).</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Payout volume</div>
              <div className={styles.kpiValue}>{fmtNgn(kpis.payoutVolume)}</div>
              <div className={styles.kpiHint}>Completed merchant withdrawals (Paystack transfers).</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Net platform revenue</div>
              <div className={styles.kpiValue}>{fmtNgn(kpis.netRevenue)}</div>
              <div className={styles.kpiHint}>Commission + VAT held per ledger (ChopFast skill model).</div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <BarChart3 size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 8 }} />
              Revenue by merchant (commission leaderboard)
            </h2>
            <p className={styles.hint} style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
              Bars show share of top merchant commission in this view ({leaderboard.list.length} merchants).
            </p>
            {leaderboard.list.length === 0 ? (
              <div className={styles.empty}>No commission ledger rows in this period.</div>
            ) : (
              <div className={styles.leaderboard}>
                {leaderboard.list.map((row, i) => (
                  <div key={row.merchantId} className={styles.lbRow}>
                    <div className={styles.lbTop}>
                      <div className={styles.lbRank}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.lbName}>{row.name}</div>
                        <div className={styles.lbMeta}>
                          Food (ledger) {fmtNgn(row.food)} · Commission {fmtNgn(row.commission)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.lbBarWrap}>
                      <div
                        className={styles.lbBar}
                        style={{ width: `${(row.commission / leaderboard.maxC) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileSpreadsheet size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 8 }} />
              VAT & commission report
            </h2>
            <div className={styles.exportRow}>
              <button type="button" className={styles.btn} onClick={exportVatCsv} disabled={ledger.length === 0}>
                <Download size={18} />
                Export CSV ({ledger.length} rows)
              </button>
              {vatRemittanceOn && (
                <button
                  type="button"
                  className={styles.btn}
                  disabled={ledger.length === 0 || filingBusy}
                  onClick={() => void recordVatFiling()}
                >
                  Record VAT filing (audit)
                </button>
              )}
              <span className={styles.hint}>
                VAT column from ledger; use for NDPR / internal remittance tracking. Includes
                merchant name and order linkage.
              </span>
            </div>
            {filingMsg && <p className={styles.hint}>{filingMsg}</p>}
            <p className={styles.hint}>
              Total VAT in view: <strong>{fmtNgn(kpis.vat)}</strong>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
