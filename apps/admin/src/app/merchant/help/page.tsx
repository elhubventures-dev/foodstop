'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, BookOpen, Wallet, Radio, MessageSquare } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';

const supportEmail =
  process.env.NEXT_PUBLIC_MERCHANT_SUPPORT_EMAIL ?? 'partners@foodstop.ng';

export default function MerchantHelpPage() {
  const { session } = useMerchantAuth();
  if (!session) return null;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Help</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
        Quick answers for running your store on Food Stop.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <section className="card" style={{ padding: '1rem 1.15rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} /> Live orders
          </h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            New orders appear in <strong>Live orders</strong> as soon as a customer pays. Move cards across
            columns to update status. Keep this tab open for real-time updates; you will hear a chime on new
            orders if your browser allows sound.
          </p>
        </section>

        <section className="card" style={{ padding: '1rem 1.15rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} /> Connection issues
          </h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            If the socket indicator shows offline, refresh the page and sign in again. Ensure your network
            allows WebSockets. Status updates still apply via the API when you drag cards.
          </p>
        </section>

        <section className="card" style={{ padding: '1rem 1.15rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={18} /> Wallet & payouts
          </h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            Earnings move from <strong>pending</strong> to <strong>available</strong> after the platform hold
            period. Withdrawals require a verified bank account and SMS OTP. Minimum and processing times are
            shown on the withdrawal form.
          </p>
        </section>

        <section className="card" style={{ padding: '1rem 1.15rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} /> Support tickets
          </h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            For payouts, verification, or technical problems, open a ticket in{' '}
            <Link href="/merchant/support" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Support
            </Link>
            . Operations replies in the same thread so nothing gets lost.
          </p>
        </section>

        <section className="card" style={{ padding: '1rem 1.15rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={18} /> Email (optional)
          </h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            You can also email{' '}
            <a href={`mailto:${supportEmail}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              {supportEmail}
            </a>{' '}
            from your registered business address. Include your store name:{' '}
            <strong>{session.merchant.business_name}</strong>.
          </p>
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-text-secondary)',
            }}
          >
            <Phone size={16} />
            OTP and payout SMS are sent to the phone on your merchant profile.
          </p>
        </section>
      </div>
    </div>
  );
}
