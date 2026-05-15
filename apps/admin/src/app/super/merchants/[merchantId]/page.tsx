'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SuperMerchantDrilldown } from '@/components/super/SuperMerchantDrilldown';

export default function SuperMerchantDetailPage() {
  const params = useParams();
  const merchantId = typeof params?.merchantId === 'string' ? params.merchantId : '';
  if (!merchantId) {
    return <div style={{ padding: '2rem' }}>Invalid merchant.</div>;
  }
  return (
    <div style={{ padding: '2rem' }}>
      <SuperMerchantDrilldown merchantId={merchantId} />
    </div>
  );
}
