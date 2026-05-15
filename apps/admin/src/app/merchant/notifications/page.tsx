'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import { merchantApiGet, merchantApiPost } from '@/lib/merchantApi';

type Row = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  data?: Record<string, unknown> | null;
  is_read: boolean | null;
  created_at: string;
};

export default function MerchantNotificationsPage() {
  const { accessToken } = useMerchantAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await merchantApiGet<Row[]>(
        '/merchant/notifications?limit=100',
        accessToken,
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    if (!accessToken) return;
    setBusy(true);
    try {
      await merchantApiPost(`/merchant/notifications/${id}/read`, accessToken);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const markAll = async () => {
    if (!accessToken) return;
    setBusy(true);
    try {
      await merchantApiPost('/merchant/notifications/read-all', accessToken);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (!accessToken) return null;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 720 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Notifications
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Wallet, orders, disputes, and platform messages for your store.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || rows.every((r) => r.is_read)}
          onClick={() => void markAll()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <CheckCheck size={16} /> Mark all read
        </button>
      </div>

      {err && (
        <p style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{err}</p>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
          <Loader2 size={20} className="spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <Bell size={28} style={{ marginBottom: 8, opacity: 0.6 }} />
          <p style={{ margin: 0 }}>No notifications yet.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => (
            <li
              key={r.id}
              className="card"
              style={{
                padding: '1rem 1.1rem',
                opacity: r.is_read ? 0.72 : 1,
                borderLeft: r.is_read ? undefined : '3px solid var(--color-primary, #16a34a)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    {r.type.replace(/_/g, ' ')} ·{' '}
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title ?? 'Notice'}</div>
                  {r.body && (
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.45, color: 'var(--color-text-secondary)' }}>
                      {r.body}
                    </p>
                  )}
                </div>
                {!r.is_read && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => void markRead(r.id)}
                    style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    title="Mark read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
