'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import { MerchantWalletScreen } from '@/components/merchant/MerchantWalletScreen';
import styles from './superMerchantDrilldown.module.css';

type Tab = 'profile' | 'orders' | 'wallet' | 'docs' | 'controls';

type MerchantRow = {
  id: string;
  business_name: string;
  slug: string;
  business_email: string;
  business_phone: string;
  city: string | null;
  state: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  is_suspended: boolean | null;
  commission_rate: number | string | null;
  suspension_reason: string | null;
  created_at: string;
};

type TierRow = {
  merchant_id: string;
  tier: string;
  commission_override: number | string | null;
};

type DocRow = {
  id: string;
  doc_type: string;
  doc_url: string;
  status: string;
  created_at: string;
};

type SlotRow = {
  id: string;
  slot_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
  amount_paid: number | string | null;
  ops_approved: boolean | null;
};

type OrderRow = {
  id: string;
  total: number | string;
  status: string;
  created_at: string;
};

export function SuperMerchantDrilldown({ merchantId }: { merchantId: string }) {
  const [tab, setTab] = useState<Tab>('profile');
  const [merchant, setMerchant] = useState<MerchantRow | null>(null);
  const [tier, setTier] = useState<TierRow | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [commissionRate, setCommissionRate] = useState('');
  const [tierOverride, setTierOverride] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [slotType, setSlotType] = useState('homepage_hero');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMerchant = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const { data: m, error: mErr } = await supabase
      .from('merchants')
      .select(
        'id, business_name, slug, business_email, business_phone, city, state, is_active, is_verified, is_featured, is_suspended, commission_rate, suspension_reason, created_at',
      )
      .eq('id', merchantId)
      .maybeSingle();

    if (mErr || !m) {
      setErr(mErr?.message ?? 'Merchant not found.');
      setMerchant(null);
      setLoading(false);
      return;
    }

    const row = m as MerchantRow;
    setMerchant(row);
    setCommissionRate(String(Number(row.commission_rate ?? 0.15)));
    setIsFeatured(!!row.is_featured);

    const [{ data: t }, { data: d }, { data: s }, { data: o }] = await Promise.all([
      supabase.from('merchant_tiers').select('merchant_id, tier, commission_override').eq('merchant_id', merchantId).maybeSingle(),
      supabase.from('merchant_documents').select('id, doc_type, doc_url, status, created_at').eq('merchant_id', merchantId).order('created_at', { ascending: false }),
      supabase
        .from('merchant_featured_slots')
        .select('id, slot_type, start_date, end_date, is_active, amount_paid, ops_approved')
        .eq('merchant_id', merchantId)
        .order('start_date', { ascending: false }),
      supabase.from('orders').select('id, total, status, created_at').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(80),
    ]);

    const tr = t as TierRow | null;
    setTier(tr);
    setTierOverride(tr?.commission_override != null ? String(Number(tr.commission_override)) : '');
    setDocs((d ?? []) as DocRow[]);
    setSlots((s ?? []) as SlotRow[]);
    setOrders((o ?? []) as OrderRow[]);
    setLoading(false);
  }, [merchantId]);

  useEffect(() => {
    void loadMerchant();
  }, [loadMerchant]);

  const saveCommissionAndFeatured = async () => {
    if (!merchant) return;
    const rate = Number(commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 0.5) {
      setErr('Commission rate must be between 0 and 0.5 (50%).');
      return;
    }
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const { error: u1 } = await supabase
        .from('merchants')
        .update({ commission_rate: rate, is_featured: isFeatured })
        .eq('id', merchant.id);
      if (u1) throw new Error(u1.message);
      setMsg('Merchant commission and featured flag saved.');
      await loadMerchant();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveTierOverride = async () => {
    const raw = tierOverride.trim();
    const override = raw === '' ? null : Number(raw);
    if (override != null && (!Number.isFinite(override) || override < 0 || override > 0.5)) {
      setErr('Tier override must be empty or between 0 and 0.5.');
      return;
    }
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      if (tier) {
        const { error } = await supabase
          .from('merchant_tiers')
          .update({ commission_override: override })
          .eq('merchant_id', merchantId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('merchant_tiers').insert({
          merchant_id: merchantId,
          tier: 'bronze',
          commission_override: override,
        });
        if (error) throw new Error(error.message);
      }
      setMsg('Tier commission override saved.');
      await loadMerchant();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addFeaturedSlot = async () => {
    if (!slotStart || !slotEnd) {
      setErr('Choose start and end dates for the slot.');
      return;
    }
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { error } = await supabase.from('merchant_featured_slots').insert({
        merchant_id: merchantId,
        slot_type: slotType,
        start_date: slotStart,
        end_date: slotEnd,
        is_active: true,
        ops_approved: true,
        created_by: session?.user?.id ?? null,
      });
      if (error) throw new Error(error.message);
      setMsg('Featured slot added.');
      setSlotStart('');
      setSlotEnd('');
      await loadMerchant();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Insert failed');
    } finally {
      setSaving(false);
    }
  };

  const approveFeaturedSlot = async (slotId: string) => {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('merchant_featured_slots')
        .update({ ops_approved: true })
        .eq('id', slotId)
        .eq('merchant_id', merchantId);
      if (error) throw new Error(error.message);
      setMsg('Slot approved for storefront.');
      await loadMerchant();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(
    () =>
      [
        { id: 'profile' as Tab, label: 'Profile' },
        { id: 'orders' as Tab, label: 'Orders' },
        { id: 'wallet' as Tab, label: 'Wallet' },
        { id: 'docs' as Tab, label: 'Documents' },
        { id: 'controls' as Tab, label: 'Commission & featured' },
      ] as const,
    [],
  );

  if (loading && !merchant) {
    return (
      <div className={styles.wrap} style={{ padding: '2rem' }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="animate-spin" size={22} /> Loading merchant…
        </p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className={styles.wrap} style={{ padding: '2rem' }}>
        <p className={styles.err}>{err ?? 'Not found.'}</p>
        <Link href="/super/merchants" className={styles.back}>
          <ChevronLeft size={16} /> Back to merchants
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <Link href="/super/merchants" className={styles.back}>
        <ChevronLeft size={16} /> All merchants
      </Link>

      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>{merchant.business_name}</h1>
          <p className={styles.sub}>
            {merchant.slug} · {merchant.business_email} · {merchant.business_phone}
          </p>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {err && <p className={styles.err}>{err}</p>}
      {msg && <p className={styles.ok}>{msg}</p>}

      {tab === 'profile' && (
        <div className={styles.card}>
          <div className={styles.grid2}>
            <div>
              <span className={styles.label}>City / state</span>
              <p>
                {merchant.city ?? '—'}, {merchant.state ?? '—'}
              </p>
            </div>
            <div>
              <span className={styles.label}>Status</span>
              <p>
                Active: {merchant.is_active ? 'yes' : 'no'} · Verified: {merchant.is_verified ? 'yes' : 'no'} ·
                Suspended: {merchant.is_suspended ? 'yes' : 'no'}
              </p>
              {merchant.suspension_reason && (
                <p className={styles.muted}>Reason: {merchant.suspension_reason}</p>
              )}
            </div>
            <div>
              <span className={styles.label}>Commission (merchant row)</span>
              <p>{Number(merchant.commission_rate ?? 0).toFixed(4)}</p>
            </div>
            <div>
              <span className={styles.label}>Featured (quick flag)</span>
              <p>{merchant.is_featured ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className={styles.card} style={{ overflow: 'auto' }}>
          {orders.length === 0 ? (
            <p className={styles.muted}>No orders for this merchant.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id.slice(0, 8)}…</td>
                    <td>₦{Number(o.total).toLocaleString('en-NG')}</td>
                    <td>{o.status}</td>
                    <td className={styles.muted}>{new Date(o.created_at).toLocaleString('en-NG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'wallet' && (
        <div>
          <p className={styles.muted} style={{ marginBottom: '0.75rem' }}>
            Read-only wallet view via Supabase (staff session). Withdrawals still run through the merchant API.
          </p>
          <MerchantWalletScreen merchantId={merchantId} />
        </div>
      )}

      {tab === 'docs' && (
        <div className={styles.card}>
          {docs.length === 0 ? (
            <p className={styles.muted}>No documents uploaded.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.doc_type}</td>
                    <td>{d.status}</td>
                    <td className={styles.muted}>{new Date(d.created_at).toLocaleString('en-NG')}</td>
                    <td>
                      <a className={styles.docLink} href={d.doc_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'controls' && (
        <div className={styles.grid2}>
          <div className={styles.card}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Merchant commission & featured</h3>
            <p className={styles.muted}>
              <code>merchants.commission_rate</code> (0–0.5) and homepage-style featured flag.
            </p>
            <label className={styles.label} htmlFor="cr">
              Commission rate
            </label>
            <input
              id="cr"
              className={styles.input}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
            <label style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured merchant (<code>is_featured</code>)
            </label>
            <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => void saveCommissionAndFeatured()}>
              Save
            </button>
          </div>

          <div className={styles.card}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Tier commission override</h3>
            <p className={styles.muted}>
              Optional <code>merchant_tiers.commission_override</code>. Leave empty to clear.
            </p>
            <label className={styles.label} htmlFor="ov">
              Override (decimal)
            </label>
            <input
              id="ov"
              className={styles.input}
              value={tierOverride}
              onChange={(e) => setTierOverride(e.target.value)}
              placeholder="e.g. 0.12"
            />
            <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => void saveTierOverride()}>
              Save override
            </button>
          </div>

          <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Featured slots</h3>
            <p className={styles.muted}>Rows in <code>merchant_featured_slots</code> (hero / category / search placements).</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <div>
                <span className={styles.label}>Slot type</span>
                <select className={styles.input} value={slotType} onChange={(e) => setSlotType(e.target.value)}>
                  <option value="homepage_hero">homepage_hero</option>
                  <option value="category_top">category_top</option>
                  <option value="search_top">search_top</option>
                </select>
              </div>
              <div>
                <span className={styles.label}>Start date</span>
                <input className={styles.input} type="date" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
              </div>
              <div>
                <span className={styles.label}>End date</span>
                <input className={styles.input} type="date" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
              </div>
              <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => void addFeaturedSlot()}>
                Add slot
              </button>
            </div>
            {slots.length === 0 ? (
              <p className={styles.muted}>No slots yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Active</th>
                    <th>Ops OK</th>
                    <th>Paid</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.id}>
                      <td>{s.slot_type}</td>
                      <td>{s.start_date}</td>
                      <td>{s.end_date}</td>
                      <td>{s.is_active ? 'yes' : 'no'}</td>
                      <td>{s.ops_approved ? 'yes' : 'no'}</td>
                      <td>₦{Number(s.amount_paid ?? 0).toLocaleString('en-NG')}</td>
                      <td>
                        {!s.ops_approved && (
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            disabled={saving}
                            onClick={() => void approveFeaturedSlot(s.id)}
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
