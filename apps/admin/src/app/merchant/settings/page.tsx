'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMerchantAuth } from '@/context/MerchantAuthContext';

export default function MerchantSettingsPage() {
  const { session, logout } = useMerchantAuth();
  const router = useRouter();

  if (!session) return null;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Settings</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Store profile flags from your session.
      </p>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Business</div>
          <div style={{ fontWeight: 600 }}>{session.merchant.business_name}</div>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Merchant ID</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{session.merchant.id}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem' }}>
          <span>Verified: {session.merchant.is_verified ? 'Yes' : 'No'}</span>
          <span>Active: {session.merchant.is_active ? 'Yes' : 'No'}</span>
          <span>Suspended: {session.merchant.is_suspended ? 'Yes' : 'No'}</span>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ marginTop: '1.25rem' }}
        onClick={() => {
          logout();
          router.replace('/merchant/login');
        }}
      >
        Sign out
      </button>
    </div>
  );
}
