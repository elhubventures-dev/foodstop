'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import { merchantApiGet } from '@/lib/merchantApi';

type WalletSummary = {
  available_balance?: number;
  pending_balance?: number;
  total_earned?: number;
  total_withdrawn?: number;
  total_commission_paid?: number;
};

type OrderRow = {
  id: string;
  status: string;
  total: number | string;
  created_at: string;
};

type ReviewRow = { food_rating: number };

function money(n: number): string {
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function MerchantAnalyticsPage() {
  const { session, accessToken } = useMerchantAuth();
  const [w, setW] = useState<WalletSummary | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const canApi =
    session?.merchant.is_verified === true && session?.merchant.is_active === true;

  const load = useCallback(async () => {
    if (!accessToken || !canApi) {
      setW(null);
      setOrders([]);
      setReviews([]);
      setLoading(false);
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const [walletData, orderData, reviewData] = await Promise.all([
        merchantApiGet<WalletSummary>('/merchant/wallet', accessToken),
        merchantApiGet<OrderRow[]>('/merchant/orders?limit=400', accessToken),
        merchantApiGet<ReviewRow[]>('/merchant/reviews', accessToken).catch(() => [] as ReviewRow[]),
      ]);
      setW(walletData);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [accessToken, canApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = 14;
  const chart = useMemo(() => {
    const end = startOfDay(new Date());
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    const labels: string[] = [];
    const revenueByKey: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      const k = dayKey(dt);
      labels.push(k);
      revenueByKey[k] = 0;
    }

    for (const o of orders) {
      if (o.status !== 'delivered') continue;
      const t = Number(o.total ?? 0);
      if (!Number.isFinite(t)) continue;
      const k = dayKey(new Date(o.created_at));
      if (revenueByKey[k] !== undefined) revenueByKey[k] += t;
    }

    const series = labels.map((k) => ({ key: k, revenue: revenueByKey[k] ?? 0 }));
    const maxR = Math.max(...series.map((s) => s.revenue), 1);
    return { series, maxR };
  }, [orders]);

  const statusMix = useMemo(() => {
    let delivered = 0;
    let cancelled = 0;
    let other = 0;
    for (const o of orders) {
      if (o.status === 'delivered') delivered += 1;
      else if (o.status === 'cancelled') cancelled += 1;
      else other += 1;
    }
    const total = delivered + cancelled + other || 1;
    return {
      delivered,
      cancelled,
      other,
      total,
      pct: (n: number) => Math.round((n / total) * 1000) / 10,
    };
  }, [orders]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    const s = reviews.reduce((a, r) => a + (Number(r.food_rating) || 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);

  if (!session) return null;

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Analytics</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Wallet snapshot, delivered revenue by day, and order status mix (from your recent orders).
      </p>
      {!canApi && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Available after verification.</p>
      )}
      {err && <p style={{ color: 'var(--color-error)' }}>{err}</p>}
      {canApi && loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="spin" size={20} /> Loading…
        </div>
      )}

      {canApi && !loading && w && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {(
              [
                ['Available', w.available_balance],
                ['Pending', w.pending_balance],
                ['Lifetime earned', w.total_earned],
                ['Commission paid', w.total_commission_paid],
                ['Total withdrawn', w.total_withdrawn],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{label}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 6 }}>
                  ₦{Number(val ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
            {avgRating != null && (
              <div key="rating" className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Avg food rating</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 6 }}>
                  {avgRating} <span style={{ color: '#ca8a04' }}>★</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    {' '}
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="merchant-analytics-grid">
            <div className="card" style={{ padding: '1rem 1rem 1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Delivered revenue (14 days)
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                Sum of order totals with status <code>delivered</code>.
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 6,
                  height: 160,
                  paddingTop: 8,
                }}
              >
                {chart.series.map((s) => {
                  const h = Math.max(6, (s.revenue / chart.maxR) * 100);
                  return (
                    <div
                      key={s.key}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                      title={`${s.key}: ${money(s.revenue)}`}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 36,
                          margin: '0 auto',
                          height: `${h}%`,
                          minHeight: 4,
                          background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                          borderRadius: 6,
                        }}
                      />
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-secondary)',
                          marginTop: 6,
                          transform: 'rotate(-45deg)',
                          transformOrigin: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.key.slice(5)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Orders by status</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                Last {orders.length} orders loaded.
              </p>
              <div
                style={{
                  display: 'flex',
                  height: 28,
                  borderRadius: 8,
                  overflow: 'hidden',
                  marginBottom: '0.75rem',
                }}
              >
                {statusMix.delivered > 0 && (
                  <div
                    style={{
                      flex: statusMix.delivered,
                      background: '#22c55e',
                      minWidth: statusMix.delivered ? 4 : 0,
                    }}
                    title={`Delivered ${statusMix.delivered}`}
                  />
                )}
                {statusMix.cancelled > 0 && (
                  <div
                    style={{
                      flex: statusMix.cancelled,
                      background: '#ef4444',
                      minWidth: statusMix.cancelled ? 4 : 0,
                    }}
                    title={`Cancelled ${statusMix.cancelled}`}
                  />
                )}
                {statusMix.other > 0 && (
                  <div
                    style={{
                      flex: statusMix.other,
                      background: '#94a3b8',
                      minWidth: statusMix.other ? 4 : 0,
                    }}
                    title={`Other ${statusMix.other}`}
                  />
                )}
              </div>
              <ul style={{ fontSize: '0.875rem', margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                <li>
                  Delivered: {statusMix.delivered} ({statusMix.pct(statusMix.delivered)}%)
                </li>
                <li>
                  Cancelled: {statusMix.cancelled} ({statusMix.pct(statusMix.cancelled)}%)
                </li>
                <li>
                  Other: {statusMix.other} ({statusMix.pct(statusMix.other)}%)
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
