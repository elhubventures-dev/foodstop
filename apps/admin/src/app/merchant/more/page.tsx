'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  ChevronRight,
  Flame,
  History,
  LifeBuoy,
  MessageSquare,
  MessageSquareText,
  Percent,
  Sprout,
  Settings,
  ShieldAlert,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';

const LINKS: { href: string; label: string; desc: string; icon: React.ElementType }[] = [
  { href: '/merchant/live-orders', label: 'Live orders', desc: 'Kanban board', icon: Flame },
  { href: '/merchant/orders/history', label: 'Order history', desc: 'Past orders', icon: History },
  { href: '/merchant/menu', label: 'Menu', desc: 'Categories & items', icon: UtensilsCrossed },
  { href: '/merchant/payouts', label: 'Wallet & payouts', desc: 'Balances & withdrawals', icon: Wallet },
  { href: '/merchant/analytics', label: 'Analytics', desc: 'Sales & status mix', icon: BarChart3 },
  { href: '/merchant/reviews', label: 'Reviews', desc: 'Ratings & replies', icon: MessageSquareText },
  { href: '/merchant/promotions', label: 'Promotions', desc: 'Discount codes', icon: Percent },
  { href: '/merchant/growth', label: 'Growth & safety', desc: 'Referrals, VAT, marketing, slots', icon: Sprout },
  { href: '/merchant/notifications', label: 'Notifications', desc: 'Inbox & read receipts', icon: Bell },
  { href: '/merchant/team', label: 'Team', desc: 'Roles & invites', icon: Users },
  { href: '/merchant/support', label: 'Support tickets', desc: 'Chat with operations', icon: MessageSquare },
  { href: '/merchant/disputes', label: 'Disputes', desc: 'Order dispute cases', icon: ShieldAlert },
  { href: '/merchant/settings', label: 'Settings', desc: 'Account & sign out', icon: Settings },
  { href: '/merchant/help', label: 'Help', desc: 'FAQ & guides', icon: LifeBuoy },
];

export default function MerchantMorePage() {
  const { session } = useMerchantAuth();
  if (!session) return null;

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>More</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
        {session.merchant.business_name} — all tools in one place on small screens.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LINKS.map(({ href, label, desc, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.85rem 1rem',
                background: 'var(--color-surface, #fff)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Icon size={22} style={{ color: 'var(--color-primary, #16a34a)', flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem' }}>{label}</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {desc}
                </span>
              </span>
              <ChevronRight size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
