'use client';

import React from 'react';
import { MerchantAuthProvider } from '@/context/MerchantAuthContext';
import { MerchantShell } from '@/components/merchant/MerchantShell';

export default function MerchantPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MerchantAuthProvider>
      <MerchantShell>{children}</MerchantShell>
    </MerchantAuthProvider>
  );
}
