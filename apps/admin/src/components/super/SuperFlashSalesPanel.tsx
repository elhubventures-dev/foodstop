'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from './growthSafety.module.css';

type FlashRow = {
  id: string;
  title: string | null;
  discount_type: string | null;
  discount_value: number | string | null;
  applies_to: string | null;
  start_at: string | null;
  end_at: string | null;
  budget_cap: number | string | null;
  amount_used: number | string | null;
  is_active: boolean | null;
};

export function SuperFlashSalesPanel() {
  const [rows, setRows] = useState<FlashRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState('free_delivery');
  const [discountValue, setDiscountValue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [budgetCap, setBudgetCap] = useState('');

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_flash_sales')
      .select('id, title, discount_type, discount_value, applies_to, start_at, end_at, budget_cap, amount_used, is_active')
      .order('start_at', { ascending: false })
      .limit(100);
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as FlashRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createSale = async () => {
    if (!title.trim() || !startAt || !endAt) {
      setErr('Title, start, and end are required.');
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const cap = budgetCap.trim() === '' ? null : Number(budgetCap);
    const dv = discountValue.trim() === '' ? null : Number(discountValue);
    const { error } = await supabase.from('platform_flash_sales').insert({
      title: title.trim(),
      discount_type: discountType,
      discount_value: dv,
      applies_to: 'all',
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      budget_cap: cap,
      is_active: true,
      created_by: session?.user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg('Flash sale created. Enable the “Platform flash sales” feature flag for customers to see the banner.');
    setTitle('');
    setDiscountValue('');
    setBudgetCap('');
    await load();
  };

  const toggleActive = async (r: FlashRow) => {
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from('platform_flash_sales')
      .update({ is_active: !(r.is_active !== false) })
      .eq('id', r.id);
    setBusy(false);
    if (error) setErr(error.message);
    else await load();
  };

  return (
    <div className={styles.page}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Platform flash sales</h1>
      <p className={styles.muted} style={{ marginBottom: '1.25rem' }}>
        Orchestrate homepage promotions. Pair with the <code>platform_flash_sales</code> feature flag.
      </p>
      <button type="button" className={styles.btn} onClick={() => void load()} disabled={loading} style={{ marginBottom: '1rem' }}>
        <RefreshCw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
        Refresh
      </button>
      {err && <p className={styles.err}>{err}</p>}
      {msg && <p style={{ color: '#059669', fontSize: '0.875rem' }}>{msg}</p>}

      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>Create sale</h2>
        <div style={{ display: 'grid', gap: '0.65rem', maxWidth: 520 }}>
          <input className={styles.input} placeholder="Title (e.g. Free Delivery Friday)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className={styles.select} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
            <option value="free_delivery">free_delivery</option>
            <option value="percent">percent</option>
            <option value="fixed">fixed</option>
          </select>
          <input className={styles.input} placeholder="Discount value (percent or fixed ₦; optional for free_delivery)" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
          <label className={styles.muted}>
            Start <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} style={{ marginLeft: 8 }} />
          </label>
          <label className={styles.muted}>
            End <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} style={{ marginLeft: 8 }} />
          </label>
          <input className={styles.input} placeholder="Budget cap (NGN, optional)" value={budgetCap} onChange={(e) => setBudgetCap(e.target.value)} />
          <button type="button" className={styles.btnPrimary} disabled={busy} onClick={() => void createSale()}>
            Create
          </button>
        </div>
      </div>

      {loading ? (
        <Loader2 className="animate-spin" size={22} />
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Window</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.title ?? '—'}</td>
                  <td>
                    {r.discount_type}
                    {r.discount_value != null && r.discount_type !== 'free_delivery' && (
                      <span className={styles.muted}> ({String(r.discount_value)})</span>
                    )}
                  </td>
                  <td className={styles.muted} style={{ fontSize: '0.75rem' }}>
                    {r.start_at ? new Date(r.start_at).toLocaleString('en-NG') : '—'} →{' '}
                    {r.end_at ? new Date(r.end_at).toLocaleString('en-NG') : '—'}
                  </td>
                  <td>{r.is_active !== false ? 'yes' : 'no'}</td>
                  <td>
                    <button type="button" className={styles.btn} disabled={busy} onClick={() => void toggleActive(r)}>
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
