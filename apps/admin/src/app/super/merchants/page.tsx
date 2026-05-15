'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from '@/components/super/superMerchantDrilldown.module.css';

type Row = {
  id: string;
  business_name: string;
  slug: string;
  business_email: string;
  city: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
};

async function staffBearer(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sign in to the admin app as staff or admin.');
  }
  return session.access_token;
}

export default function SuperMerchantsListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const token = await staffBearer();
      const res = await fetch('/api/super/merchants?scope=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as { rows?: Row[]; error?: string };
      if (!res.ok) {
        setErr(json.error ?? `HTTP ${res.status}`);
        setRows([]);
      } else {
        setRows(json.rows ?? []);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load merchants');
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.business_name.toLowerCase().includes(s) ||
        r.slug.toLowerCase().includes(s) ||
        r.business_email.toLowerCase().includes(s) ||
        (r.city && r.city.toLowerCase().includes(s)),
    );
  }, [rows, q]);

  return (
    <div style={{ padding: '2rem' }}>
      <Link href="/super" className={styles.back}>
        <ChevronLeft size={16} /> Super Admin home
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Merchants</h1>
      <p className={styles.muted} style={{ marginBottom: '1rem' }}>
        Open a merchant for profile, orders, wallet, documents, commission, featured slots, and
        featured flag.
      </p>
      <input
        type="search"
        placeholder="Search name, slug, email, city…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={styles.input}
        style={{ maxWidth: 360, marginBottom: '1rem' }}
      />
      {loading ? (
        <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="animate-spin" size={20} /> Loading…
        </p>
      ) : err ? (
        <p className={styles.err}>{err}</p>
      ) : (
        <div className={styles.card} style={{ overflow: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Business</th>
                <th>Slug</th>
                <th>Email</th>
                <th>City</th>
                <th>Active</th>
                <th>Featured</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.business_name}</td>
                  <td>{r.slug}</td>
                  <td>{r.business_email}</td>
                  <td>{r.city ?? '—'}</td>
                  <td>{r.is_active ? 'yes' : 'no'}</td>
                  <td>{r.is_featured ? 'yes' : 'no'}</td>
                  <td>
                    <Link href={`/super/merchants/${r.id}`} className={styles.docLink}>
                      Open
                    </Link>
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
