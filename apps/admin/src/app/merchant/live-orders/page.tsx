'use client';

import React from 'react';
import { LiveOrdersKanban } from '@/components/merchant/LiveOrdersKanban';
import { useMerchantAuth } from '@/context/MerchantAuthContext';

/**
 * Merchant portal — Live Orders Kanban.
 * Uses the logged-in merchant session for API + Socket.IO. Optional
 * NEXT_PUBLIC_MERCHANT_ID is a dev fallback when session is not yet available.
 */
export default function MerchantLiveOrdersPage() {
  const { session, accessToken } = useMerchantAuth();
  const merchantId =
    session?.merchant.id ??
    process.env.NEXT_PUBLIC_MERCHANT_ID ??
    '00000000-0000-0000-0000-000000000001';

  return (
    <div style={{ padding: '2rem' }}>
      <LiveOrdersKanban merchantId={merchantId} accessToken={accessToken} />
    </div>
  );
}
