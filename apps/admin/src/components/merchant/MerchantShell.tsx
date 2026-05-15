'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Flame,
  UtensilsCrossed,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  History,
  Star,
  BadgePercent,
  LifeBuoy,
  Menu,
  Bell,
  Users,
  MessageSquare,
  ShieldAlert,
  Sprout,
} from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import styles from './merchantShell.module.css';

const NAV = [
  { href: '/merchant', label: 'Overview', icon: LayoutDashboard },
  { href: '/merchant/live-orders', label: 'Live orders', icon: Flame },
  { href: '/merchant/orders/history', label: 'Order history', icon: History },
  { href: '/merchant/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/merchant/payouts', label: 'Wallet & payouts', icon: Wallet },
  { href: '/merchant/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/merchant/reviews', label: 'Reviews', icon: Star },
  { href: '/merchant/promotions', label: 'Promotions', icon: BadgePercent },
  { href: '/merchant/growth', label: 'Growth & safety', icon: Sprout },
  { href: '/merchant/notifications', label: 'Notifications', icon: Bell },
  { href: '/merchant/team', label: 'Team', icon: Users },
  { href: '/merchant/support', label: 'Support', icon: MessageSquare },
  { href: '/merchant/disputes', label: 'Disputes', icon: ShieldAlert },
  { href: '/merchant/help', label: 'Help', icon: LifeBuoy },
  { href: '/merchant/settings', label: 'Settings', icon: Settings },
] as const;

const BOTTOM_TABS: {
  href: string;
  label: string;
  icon: React.ElementType;
  match: (p: string) => boolean;
}[] = [
  { href: '/merchant', label: 'Home', icon: LayoutDashboard, match: (p) => p === '/merchant' },
  {
    href: '/merchant/live-orders',
    label: 'Orders',
    icon: Flame,
    match: (p) => p.startsWith('/merchant/live-orders') || p.startsWith('/merchant/orders'),
  },
  { href: '/merchant/menu', label: 'Menu', icon: UtensilsCrossed, match: (p) => p.startsWith('/merchant/menu') },
  {
    href: '/merchant/payouts',
    label: 'Wallet',
    icon: Wallet,
    match: (p) => p.startsWith('/merchant/payouts'),
  },
  {
    href: '/merchant/more',
    label: 'More',
    icon: Menu,
    match: (p) =>
      p.startsWith('/merchant/more') ||
      p.startsWith('/merchant/analytics') ||
      p.startsWith('/merchant/reviews') ||
      p.startsWith('/merchant/promotions') ||
      p.startsWith('/merchant/growth') ||
      p.startsWith('/merchant/notifications') ||
      p.startsWith('/merchant/team') ||
      p.startsWith('/merchant/support') ||
      p.startsWith('/merchant/disputes') ||
      p.startsWith('/merchant/settings') ||
      p.startsWith('/merchant/help'),
  },
];

export function MerchantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, logout, accessToken } = useMerchantAuth();

  useEffect(() => {
    if (loading) return;
    if (pathname === '/merchant/login') return;
    if (!accessToken) {
      router.replace('/merchant/login');
    }
  }, [loading, pathname, accessToken, router]);

  useEffect(() => {
    if (loading || pathname !== '/merchant/login') return;
    if (accessToken) {
      router.replace('/merchant');
    }
  }, [loading, pathname, accessToken, router]);

  if (pathname === '/merchant/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className={styles.shell} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading merchant session…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const m = session.merchant;
  const gate =
    !m.is_verified || !m.is_active ? (
      <div className={styles.banner}>
        Your store is not live yet. Complete onboarding or wait for admin approval. Some pages
        will show errors until you are verified and active.
      </div>
    ) : null;

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.topbarTitle}>Merchant portal</span>
        <button type="button" className={styles.logoutBtn} onClick={() => logout()}>
          <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Sign out
        </button>
      </header>
      <div className={styles.shellInner}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <div className={styles.brandTitle}>{m.business_name}</div>
            <div className={styles.brandSub}>Food Stop partner</div>
          </div>
          <nav className={styles.nav}>
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/merchant'
                  ? pathname === '/merchant'
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className={styles.main}>
          {gate}
          {children}
        </main>
      </div>
      <nav className={styles.bottomNav} aria-label="Primary">
        {BOTTOM_TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.bottomNavItem} ${active ? styles.bottomNavItemActive : ''}`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
