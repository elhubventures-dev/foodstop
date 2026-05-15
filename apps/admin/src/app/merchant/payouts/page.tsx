'use client';

import React from 'react';
import { MerchantWalletScreen } from '@/components/merchant/MerchantWalletScreen';

/**
 * Wallet & payouts — loads via merchant session JWT (ChopFast API) when signed in;
 * otherwise falls back to Supabase + env JWT for local/staff-style testing.
 */
export default function MerchantPayoutsPage() {
  return <MerchantWalletScreen />;
}
