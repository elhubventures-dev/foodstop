'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MerchantApplicationReviewQueue } from '@/components/super/MerchantApplicationReviewQueue';

export default function MerchantApplicationsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <Link
        href="/super"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem',
        }}
      >
        <ChevronLeft size={16} />
        Super Admin home
      </Link>
      <MerchantApplicationReviewQueue />
    </div>
  );
}
