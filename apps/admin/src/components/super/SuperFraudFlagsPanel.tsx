'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from './growthSafety.module.css';

type Row = {
  id: string;
  flag_type: string;
  description: string | null;
  severity: string | null;
  status: string | null;
  merchant_id: string | null;
  order_id: string | null;
  customer_id: string | null;
  created_at: string;
};

const STATUSES = ['open', 'reviewed', 'dismissed', 'actioned'];

export function SuperFraudFlagsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newType, setNewType] = useState('suspicious_merchant');
  const [newDesc, setNewDesc] = useState('');
  const [newMerchantId, setNewMerchantId] = useState('');

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('fraud_flags')
      .select('id, flag_type, description, severity, status, merchant_id, order_id, customer_id, created_at')
      .order('created_at', { ascending: false })
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { error } = await supabase
      .from('fraud_flags')
      .update({ status, reviewed_by: session?.user?.id ?? null })
      .eq('id', id);
    setBusy(false);
    if (error) setErr(error.message);
    else await load();
  };

  const addManual = async () => {
    const d = newDesc.trim();
    if (d.length < 4) {
      setErr('Description required.');
      return;
    }
    setBusy(true);
    setErr(null);
    const mid = newMerchantId.trim();
    const { error } = await supabase.from('fraud_flags').insert({
      flag_type: newType,
      description: d,
      severity: 'medium',
      status: 'open',
      merchant_id: mid.length > 10 ? mid : null,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else {
      setNewDesc('');
      setNewMerchantId('');
      await load();
    }
  };

  return (
    <div className={styles.page}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Fraud flags</h1>
      <p className={styles.muted} style={{ marginBottom: '1rem' }}>
        Ops queue over <code>fraud_flags</code>. Wire automated rules incrementally when{' '}
        <code>anti_fraud_flags</code> is on.
      </p>
      <button type="button" className={styles.btn} onClick={() => void load()} disabled={loading} style={{ marginBottom: '1rem' }}>
        <RefreshCw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
        Refresh
      </button>
      {err && <p className={styles.err}>{err}</p>}

      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>Manual flag</h2>
        <select className={styles.select} value={newType} onChange={(e) => setNewType(e.target.value)} style={{ maxWidth: 280, marginBottom: 8 }}>
          <option value="suspicious_merchant">suspicious_merchant</option>
          <option value="velocity_abuse">velocity_abuse</option>
          <option value="high_value_cod">high_value_cod</option>
          <option value="address_anomaly">address_anomaly</option>
          <option value="bulk_cash_orders">bulk_cash_orders</option>
          <option value="repeated_refunds">repeated_refunds</option>
        </select>
        <input
          className={styles.input}
          placeholder="Merchant UUID (optional)"
          value={newMerchantId}
          onChange={(e) => setNewMerchantId(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <textarea className={styles.textarea} placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
        <button type="button" className={styles.btnPrimary} disabled={busy} onClick={() => void addManual()}>
          Add flag
        </button>
      </div>

      {loading ? (
        <Loader2 className="animate-spin" size={22} />
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.flag_type}</div>
                  <div className={styles.muted}>{r.description}</div>
                  {r.merchant_id && (
                    <div className={styles.muted} style={{ fontSize: '0.7rem' }}>
                      merchant {r.merchant_id.slice(0, 8)}…
                    </div>
                  )}
                </td>
                <td>{r.severity}</td>
                <td>{r.status}</td>
                <td className={styles.muted}>{new Date(r.created_at).toLocaleString('en-NG')}</td>
                <td>
                  <select
                    className={styles.select}
                    style={{ maxWidth: 140 }}
                    value={r.status ?? 'open'}
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
