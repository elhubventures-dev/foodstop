'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from './growthSafety.module.css';

type Row = {
  id: string;
  order_id: string;
  merchant_id: string;
  customer_id: string;
  reason: string;
  description: string | null;
  status: string;
  opened_at: string;
};

const STATUSES = ['open', 'investigating', 'resolved_refund', 'resolved_no_refund', 'closed'];

export function SuperDisputesPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('dispute_cases')
      .select('id, order_id, merchant_id, customer_id, reason, description, status, opened_at')
      .order('opened_at', { ascending: false })
      .limit(200);
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    setBusy(true);
    setErr(null);
    const patch: Record<string, unknown> = { status };
    if (status.startsWith('resolved') || status === 'closed') {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from('dispute_cases').update(patch).eq('id', id);
    setBusy(false);
    if (error) setErr(error.message);
    else await load();
  };

  return (
    <div className={styles.page}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Dispute cases</h1>
      <p className={styles.muted} style={{ marginBottom: '1rem' }}>
        Customer / order disputes (<code>dispute_cases</code>). Escrow hooks use the{' '}
        <code>escrow_dispute_extension</code> flag when you wire wallet holds.
      </p>
      <button type="button" className={styles.btn} onClick={() => void load()} disabled={loading} style={{ marginBottom: '1rem' }}>
        <RefreshCw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
        Refresh
      </button>
      {err && <p className={styles.err}>{err}</p>}
      {loading ? (
        <Loader2 className="animate-spin" size={22} />
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No disputes yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reason</th>
              <th>Status</th>
              <th>Order</th>
              <th>Opened</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.reason}</strong>
                  {r.description && <div className={styles.muted}>{r.description}</div>}
                </td>
                <td>{r.status}</td>
                <td>
                  <code style={{ fontSize: '0.75rem' }}>{r.order_id.slice(0, 8)}…</code>
                </td>
                <td className={styles.muted}>{new Date(r.opened_at).toLocaleString('en-NG')}</td>
                <td>
                  <select
                    className={styles.select}
                    style={{ maxWidth: 200 }}
                    value={r.status}
                    disabled={busy}
                    onChange={(e) => void setStatus(r.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
