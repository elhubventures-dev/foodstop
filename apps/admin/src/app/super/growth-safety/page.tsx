'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Sprout, Loader2 } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from '@/components/super/growthSafety.module.css';

export default function GrowthSafetyHubPage() {
  const [log, setLog] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runRating = async () => {
    setErr(null);
    setLog(null);
    setRunning(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sign in required.');
      const res = await fetch('/api/super/rating-enforcement', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; result?: unknown; ok?: boolean };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setLog(JSON.stringify(data.result, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Link href="/super" className={styles.muted} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '1rem', fontWeight: 600 }}>
        <ChevronLeft size={16} /> Super Admin home
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.5rem' }}>
        <Sprout size={32} color="var(--color-primary)" />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Growth &amp; safety</h1>
      </div>
      <p className={styles.muted} style={{ marginBottom: '1.5rem', maxWidth: 720 }}>
        Phase 8 gates live in <code>platform_feature_flags</code>. Enable a flag, then use the matching tool.
        Rating enforcement calls a DB function (service role) only when <code>rating_auto_suspension</code> is on.
        <strong> Escrow extension:</strong> when <code>escrow_dispute_extension</code> is on, resolving a dispute in the
        merchant&apos;s favour schedules wallet release after <code>DISPUTE_HOLD_HOURS</code> (API), not immediately.
        <strong> Fraud scan:</strong> when <code>anti_fraud_flags</code> is on, new checkout orders run lightweight rules
        in the web <code>POST /api/orders</code> handler (high value, velocity).
      </p>

      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', maxWidth: 560 }}>
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>Rating enforcement (manual run)</h2>
        <p className={styles.muted} style={{ marginBottom: '0.75rem' }}>
          Uses <code>merchants.low_rating_since</code> + avg_rating. Requires <code>SUPABASE_SERVICE_ROLE_KEY</code> on this app.
        </p>
        <button type="button" className={styles.btnPrimary} disabled={running} onClick={() => void runRating()}>
          {running ? (
            <>
              <Loader2 className="animate-spin" size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Running…
            </>
          ) : (
            'Run job now'
          )}
        </button>
        {err && <p className={styles.err} style={{ marginTop: '0.75rem' }}>{err}</p>}
        {log && (
          <pre
            style={{
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              background: 'var(--color-bg-secondary)',
              padding: '0.75rem',
              borderRadius: 8,
              overflow: 'auto',
            }}
          >
            {log}
          </pre>
        )}
      </div>

      <div className={styles.grid}>
        <Link href="/super/feature-flags" className={styles.card}>
          <h3 className={styles.cardTitle}>Feature flags</h3>
          <p className={styles.cardDesc}>Toggle all 15 approved modules for the platform.</p>
        </Link>
        <Link href="/super/flash-sales" className={styles.card}>
          <h3 className={styles.cardTitle}>Flash sales</h3>
          <p className={styles.cardDesc}>Create platform_flash_sales rows; customer site shows banner when flag is on.</p>
        </Link>
        <Link href="/super/fraud-flags" className={styles.card}>
          <h3 className={styles.cardTitle}>Fraud flags</h3>
          <p className={styles.cardDesc}>Review and record fraud_flags for ops.</p>
        </Link>
        <Link href="/super/disputes" className={styles.card}>
          <h3 className={styles.cardTitle}>Disputes</h3>
          <p className={styles.cardDesc}>dispute_cases queue and status updates.</p>
        </Link>
        <Link href="/super/financials" className={styles.card}>
          <h3 className={styles.cardTitle}>VAT &amp; ledger</h3>
          <p className={styles.cardDesc}>
            Platform financials + VAT CSV export; with <code>vat_remittance</code> on, record audit filings from that
            screen.
          </p>
        </Link>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Merchant growth hub</h3>
          <p className={styles.cardDesc}>
            Merchants use <code>/merchant/growth</code> in the partner portal (referrals, locations, VAT notes,
            invoices HTML, featured booking, NDPR marketing, live chat) — each section respects its feature flag.
          </p>
        </div>
      </div>
    </div>
  );
}
