'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import { merchantApiGet } from '@/lib/merchantApi';

type OrderRow = {
  id: string;
  status: string;
  total: number | string;
  created_at: string;
};

export default function MerchantOrderHistoryPage() {
  const { accessToken, session } = useMerchantAuth();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canApi =
    session?.merchant.is_verified === true && session?.merchant.is_active === true;

  const load = useCallback(async () => {
    if (!accessToken || !canApi) {
      setRows([]);
      setLoading(false);
      return;
    }
    setErr(null);
    try {
      const data = await merchantApiGet<OrderRow[]>(
        '/merchant/orders?limit=200',
        accessToken,
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [accessToken, canApi]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!session) return null;

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Order history</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Orders for your merchant ID (via API).
      </p>
      {!canApi && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Available after your store is verified.</p>
      )}
      {err && <p style={{ color: 'var(--color-error)' }}>{err}</p>}
      {canApi && loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="spin" size={20} /> Loading…
        </div>
      )}
      {canApi && !loading && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem' }}>When</th>
                <th style={{ padding: '0.75rem' }}>Order</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {r.id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>{r.status}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    ₦{Number(r.total).toLocaleString('en-NG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>No orders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
