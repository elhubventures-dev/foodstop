'use client';

import React, { useState } from 'react';
import { Loader2, Megaphone } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from './superMerchantDrilldown.module.css';

type Channel = 'in_app' | 'email' | 'sms';
type Audience = 'all_merchants' | 'selected_merchants' | 'all_customers';

async function staffFetch(path: string, body: object) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Sign in required.');
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    ok?: boolean;
    broadcast_id?: string;
    recipient_count?: number;
    warnings?: string[];
  };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function SuperBroadcastComposer() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all_merchants');
  const [merchantIdsRaw, setMerchantIdsRaw] = useState('');
  const [chInApp, setChInApp] = useState(true);
  const [chEmail, setChEmail] = useState(false);
  const [chSms, setChSms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setResult(null);
    const channels: Channel[] = [];
    if (chInApp) channels.push('in_app');
    if (chEmail) channels.push('email');
    if (chSms) channels.push('sms');
    if (channels.length === 0) {
      setErr('Select at least one channel.');
      return;
    }
    let merchantIds: string[] | undefined;
    if (audience === 'selected_merchants') {
      merchantIds = merchantIdsRaw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (merchantIds.length === 0) {
        setErr('Enter one or more merchant UUIDs (comma or space separated).');
        return;
      }
    }
    setBusy(true);
    try {
      const res = await staffFetch('/api/super/broadcasts', {
        title,
        body,
        channels,
        audience,
        merchantIds,
      });
      const w = res.warnings?.length ? ` Warnings: ${res.warnings.join(' ')}` : '';
      setResult(`Sent. Broadcast ${res.broadcast_id?.slice(0, 8)}… · ~${res.recipient_count ?? 0} in-app targets.${w}`);
      setBody('');
      setTitle('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Megaphone size={26} />
        Platform broadcast
      </h1>
      <p className={styles.muted} style={{ marginBottom: '1.25rem' }}>
        In-app delivery: inserts <code>merchant_notifications</code> (merchants) or a{' '}
        <code>customer_announcements</code> row (all customers). Email/SMS are recorded on the broadcast row
        for audit; automated dispatch can be wired later.
      </p>

      <div className={styles.card} style={{ maxWidth: 640 }}>
        <label className={styles.label} htmlFor="bt">
          Title
        </label>
        <input id="bt" className={styles.input} style={{ maxWidth: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className={styles.label} htmlFor="bb" style={{ marginTop: 12 }}>
          Body
        </label>
        <textarea
          id="bb"
          className={styles.input}
          style={{ maxWidth: '100%', minHeight: 120, resize: 'vertical' }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <span className={styles.label} style={{ marginTop: 12 }}>
          Channels
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label>
            <input type="checkbox" checked={chInApp} onChange={(e) => setChInApp(e.target.checked)} /> In-app
          </label>
          <label>
            <input type="checkbox" checked={chEmail} onChange={(e) => setChEmail(e.target.checked)} /> Email (audit
            only)
          </label>
          <label>
            <input type="checkbox" checked={chSms} onChange={(e) => setChSms(e.target.checked)} /> SMS (audit only)
          </label>
        </div>

        <span className={styles.label} style={{ marginTop: 12 }}>
          Audience
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label>
            <input
              type="radio"
              name="aud"
              checked={audience === 'all_merchants'}
              onChange={() => setAudience('all_merchants')}
            />{' '}
            All active merchants
          </label>
          <label>
            <input
              type="radio"
              name="aud"
              checked={audience === 'selected_merchants'}
              onChange={() => setAudience('selected_merchants')}
            />{' '}
            Selected merchants (UUIDs)
          </label>
          <label>
            <input
              type="radio"
              name="aud"
              checked={audience === 'all_customers'}
              onChange={() => setAudience('all_customers')}
            />{' '}
            All customers (single global announcement row)
          </label>
        </div>

        {audience === 'selected_merchants' && (
          <>
            <label className={styles.label} htmlFor="mids" style={{ marginTop: 12 }}>
              Merchant IDs
            </label>
            <textarea
              id="mids"
              className={styles.input}
              style={{ maxWidth: '100%', minHeight: 72 }}
              placeholder="uuid, uuid, …"
              value={merchantIdsRaw}
              onChange={(e) => setMerchantIdsRaw(e.target.value)}
            />
          </>
        )}

        {err && <p className={styles.err}>{err}</p>}
        {result && <p className={styles.ok}>{result}</p>}

        <button type="button" className={styles.btnPrimary} disabled={busy} onClick={() => void submit()}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
              Sending…
            </>
          ) : (
            'Send broadcast'
          )}
        </button>
      </div>
    </div>
  );
}
