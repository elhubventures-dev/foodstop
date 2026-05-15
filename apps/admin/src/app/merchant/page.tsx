'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, Wallet, ArrowRight, Award } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import { merchantApiGet } from '@/lib/merchantApi';
import { supabase, fetchPlatformFeatureFlags, isFeatureOn } from '@chopfast/shared';

type WalletSummary = {
  available_balance?: number;
  pending_balance?: number;
  total_earned?: number;
  wallet_initialized?: boolean;
};

function fmt(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '₦0';
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

const TIER_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  bronze: { bg: '#FFF4E6', fg: '#92400e', label: 'Bronze' },
  silver: { bg: '#F3F4F6', fg: '#475569', label: 'Silver' },
  gold: { bg: '#FFFBEB', fg: '#b45309', label: 'Gold' },
  platinum: { bg: '#F5F3FF', fg: '#5b21b6', label: 'Platinum' },
};

export default function MerchantOverviewPage() {
  const { session, accessToken } = useMerchantAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  type TierInfo = {
    tier: string;
    commission_override: number | null;
    monthly_gmv: number | string | null;
  };
  const [tierRow, setTierRow] = useState<TierInfo | null>(null);
  const [showTier, setShowTier] = useState(false);

  const canApi =
    session?.merchant.is_verified === true && session?.merchant.is_active === true;

  const load = useCallback(async () => {
    if (!accessToken || !canApi) return;
    setErr(null);
    try {
      const w = await merchantApiGet<WalletSummary>('/merchant/wallet', accessToken);
      setWallet(w);
      const orders = await merchantApiGet<unknown[]>(
        '/merchant/orders?limit=200',
        accessToken,
      );
      setOrderCount(Array.isArray(orders) ? orders.length : 0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load dashboard');
    }
  }, [accessToken, canApi]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const mid = session?.merchant?.id;
    if (!mid) return;
    let alive = true;
    (async () => {
      const flags = await fetchPlatformFeatureFlags(supabase);
      if (!alive) return;
      if (!isFeatureOn(flags, 'merchant_tiers_badges')) {
        setShowTier(false);
        return;
      }
      setShowTier(true);
      const { data } = await supabase
        .from('merchant_tiers')
        .select('tier, commission_override, monthly_gmv')
        .eq('merchant_id', mid)
        .maybeSingle();
      if (!alive) return;
      setTierRow((data as TierInfo | null) ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [session?.merchant?.id]);

  if (!session) return null;

  const tierKey = (tierRow?.tier ?? 'bronze').toLowerCase();
  const tierStyle = TIER_STYLES[tierKey] ?? TIER_STYLES.bronze;

  return (
    <div style={{ padding: '1.5rem 2rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
        Overview
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Welcome back, {session.merchant.business_name}.
      </p>

      {showTier && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: '1.25rem',
            padding: '0.65rem 1rem',
            borderRadius: 10,
            background: tierStyle.bg,
            color: tierStyle.fg,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <Award size={20} aria-hidden />
          <span>
            Tier: {tierStyle.label}
            {tierRow?.commission_override != null && (
              <span style={{ fontWeight: 500, marginLeft: 8 }}>
                (commission override {Number(tierRow.commission_override).toFixed(2)})
              </span>
            )}
          </span>
          {tierRow?.monthly_gmv != null && (
            <span style={{ fontWeight: 500, opacity: 0.9 }}>
              GMV (tracked): ₦{Number(tierRow.monthly_gmv).toLocaleString('en-NG')}
            </span>
          )}
        </div>
      )}

      {!canApi && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 8,
            background: 'rgba(234,179,8,0.12)',
            border: '1px solid rgba(234,179,8,0.35)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          Your account is not verified yet. After admin approval, live wallet and order data will
          load here.
        </div>
      )}

      {err && (
        <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {err}
        </div>
      )}

      {canApi && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              <Wallet size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
              Available balance
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>
              {fmt(wallet?.available_balance)}
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Pending
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{fmt(wallet?.pending_balance)}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              <TrendingUp size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
              Total earned
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{fmt(wallet?.total_earned)}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              <Package size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
              Orders (loaded)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>
              {orderCount == null ? '—' : orderCount}
            </div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Quick links</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link href="/merchant/live-orders" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Live orders <ArrowRight size={16} />
        </Link>
        <Link href="/merchant/menu" className="btn btn-secondary">
          Menu
        </Link>
        <Link href="/merchant/payouts" className="btn btn-secondary">
          Wallet & payouts
        </Link>
        <Link href="/merchant/orders/history" className="btn btn-secondary">
          Order history
        </Link>
      </div>
    </div>
  );
}
