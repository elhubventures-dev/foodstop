'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import { merchantApiGet } from '@/lib/merchantApi';

type Dispute = {
  id: string;
  order_id: string;
  reason: string | null;
  description: string | null;
  status: string | null;
  opened_at: string | null;
  resolved_at: string | null;
  refund_amount: number | string | null;
};

export default function MerchantDisputesPage() {
  const { accessToken } = useMerchantAuth();
  const [rows, setRows] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await merchantApiGet<Dispute[]>('/merchant/orders/disputes', accessToken);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load disputes');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!accessToken) return null;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Disputes</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
        Customer dispute cases linked to your orders. Resolution is coordinated by platform operations.
      </p>

      {err && (
        <p style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{err}</p>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={20} className="spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: '1.5rem', color: 'var(--color-text-secondary)' }}>
          No open dispute cases for your store.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary, #f9fafb)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 1rem' }}>Opened</th>
                <th style={{ padding: '0.65rem 1rem' }}>Order</th>
                <th style={{ padding: '0.65rem 1rem' }}>Reason</th>
                <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                <th style={{ padding: '0.65rem 1rem' }}>Refund</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}>
                    {d.opened_at ? new Date(d.opened_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {d.order_id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>{d.reason?.replace(/_/g, ' ') ?? '—'}</td>
                  <td style={{ padding: '0.65rem 1rem', textTransform: 'capitalize' }}>
                    {d.status?.replace(/_/g, ' ') ?? '—'}
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    {d.refund_amount != null && Number(d.refund_amount) > 0
                      ? `₦${Number(d.refund_amount).toLocaleString('en-NG')}`
                      : '—'}
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
