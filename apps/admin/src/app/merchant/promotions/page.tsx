'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import {
  merchantApiDelete,
  merchantApiGet,
  merchantApiPatch,
  merchantApiPost,
} from '@/lib/merchantApi';

type PromoRow = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | null;
  min_order: number | null;
  max_uses: number | null;
  uses_count: number | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean | null;
  created_at: string;
};

function money(n: number | string | null | undefined): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0);
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function MerchantPromotionsPage() {
  const { accessToken, session } = useMerchantAuth();
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed' | 'free_delivery'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [creating, setCreating] = useState(false);

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
      const data = await merchantApiGet<PromoRow[]>('/merchant/promotions', accessToken);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [accessToken, canApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const createPromo = async () => {
    if (!accessToken) return;
    if (discountType !== 'free_delivery') {
      const v = Number(discountValue);
      if (!discountValue.trim() || Number.isNaN(v)) {
        setErr('Enter a discount value for this promotion type.');
        return;
      }
    }
    setCreating(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {
        code: code.trim(),
        discount_type: discountType,
        min_order: minOrder ? Number(minOrder) : 0,
      };
      if (discountType !== 'free_delivery') {
        body.discount_value = Number(discountValue);
      }
      await merchantApiPost('/merchant/promotions', accessToken, body);
      setCode('');
      setDiscountValue('');
      setMinOrder('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (p: PromoRow) => {
    if (!accessToken) return;
    setBusyId(p.id);
    setErr(null);
    try {
      await merchantApiPatch(`/merchant/promotions/${p.id}`, accessToken, {
        is_active: !p.is_active,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!accessToken || !confirm('Delete this promotion code?')) return;
    setBusyId(id);
    setErr(null);
    try {
      await merchantApiDelete<{ ok: true }>(`/merchant/promotions/${id}`, accessToken);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const describe = (p: PromoRow) => {
    if (p.discount_type === 'percent') {
      return `${p.discount_value ?? 0}% off`;
    }
    if (p.discount_type === 'fixed') {
      return `${money(p.discount_value)} off`;
    }
    return 'Free delivery';
  };

  if (!session) return null;

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Promotions</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Discount codes apply at customer checkout (web cart + Paystack, mobile cart via ChopFast API).
      </p>
      {!canApi && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Available after your store is verified.</p>
      )}
      {err && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{err}</p>}

      {canApi && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>New code</h2>
          <div style={{ display: 'grid', gap: '0.65rem', maxWidth: 420 }}>
            <label style={{ fontSize: '0.8rem' }}>
              Code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="WELCOME10"
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.45rem 0.5rem' }}
              />
            </label>
            <label style={{ fontSize: '0.8rem' }}>
              Type
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as 'percent' | 'fixed' | 'free_delivery')
                }
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.45rem 0.5rem' }}
              >
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount (₦)</option>
                <option value="free_delivery">Free delivery</option>
              </select>
            </label>
            {discountType !== 'free_delivery' && (
              <label style={{ fontSize: '0.8rem' }}>
                {discountType === 'percent' ? 'Percent (0–100)' : 'Amount (₦)'}
                <input
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  inputMode="decimal"
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.45rem 0.5rem' }}
                />
              </label>
            )}
            <label style={{ fontSize: '0.8rem' }}>
              Minimum order (₦, optional)
              <input
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                inputMode="decimal"
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.45rem 0.5rem' }}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={creating || !code.trim()}
              onClick={() => void createPromo()}
            >
              {creating ? 'Creating…' : 'Create promotion'}
            </button>
          </div>
        </div>
      )}

      {canApi && loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="spin" size={20} /> Loading…
        </div>
      )}
      {canApi && !loading && rows.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)' }}>No promotion codes yet.</p>
      )}
      {canApi && !loading && rows.length > 0 && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem' }}>Code</th>
                <th style={{ padding: '0.75rem' }}>Offer</th>
                <th style={{ padding: '0.75rem' }}>Uses</th>
                <th style={{ padding: '0.75rem' }}>Active</th>
                <th style={{ padding: '0.75rem' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{p.code}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>{describe(p)}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    {p.uses_count ?? 0}
                    {p.max_uses != null ? ` / ${p.max_uses}` : ''}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <button
                      type="button"
                      aria-label={p.is_active ? 'Deactivate' : 'Activate'}
                      disabled={busyId === p.id}
                      onClick={() => void toggleActive(p)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {p.is_active ? <ToggleRight size={22} color="#16a34a" /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <button
                      type="button"
                      aria-label="Delete"
                      disabled={busyId === p.id}
                      onClick={() => void remove(p.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}
                    >
                      <Trash2 size={18} />
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
