'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMerchantAuth } from '@/context/MerchantAuthContext';

export default function MerchantLoginPage() {
  const { login } = useMerchantAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--color-bg, #f8fafc)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--color-surface, #fff)',
          borderRadius: 12,
          padding: '2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid var(--color-border, #e2e8f0)',
        }}
      >
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Merchant sign in
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Use the email and password from your vendor registration. API base:{' '}
          <code style={{ fontSize: '0.75rem' }}>
            {process.env.NEXT_PUBLIC_CHOPFAST_API_URL ?? 'http://localhost:4000'}
          </code>
        </p>
        <form onSubmit={(e) => void onSubmit(e)}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '1rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
            }}
          />
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '1rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
            }}
          />
          {err && (
            <p style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem' }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          <Link href="/login" style={{ color: 'var(--color-primary)' }}>
            Staff / admin login
          </Link>
        </p>
      </div>
    </div>
  );
}
