'use client';

import { useParams } from 'next/navigation';
import MerchantStorefront from '@/components/restaurants/MerchantStorefront';
import '../restaurants.css';

export default function MerchantStorefrontPage() {
  const params = useParams();
  const slug = params?.slug;
  return <MerchantStorefront slug={slug} />;
}
