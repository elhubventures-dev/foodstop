'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Users, 
  Truck, 
  Settings, 
  LogOut,
  Store,
  Columns3,
  Wallet,
  Shield,
  ClipboardList,
  PieChart,
  ChevronRight,
  Landmark,
  Banknote,
  Megaphone,
  Sprout,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Orders', icon: ShoppingBag, href: '/orders' },
  { name: 'Menu Management', icon: UtensilsCrossed, href: '/menu' },
  { name: 'Merchant Portal', icon: Store, href: '/merchant' },
  { name: 'Live Orders', icon: Columns3, href: '/merchant/live-orders' },
  { name: 'Wallet', icon: Wallet, href: '/merchant/payouts' },
  { name: 'Super Admin', icon: Shield, href: '/super' },
  { name: 'Merchant applications', icon: ClipboardList, href: '/super/merchant-applications' },
  { name: 'Platform financials', icon: PieChart, href: '/super/financials' },
  { name: 'Payout approvals', icon: Banknote, href: '/super/payouts' },
  { name: 'Merchants', icon: Landmark, href: '/super/merchants' },
  { name: 'Broadcasts', icon: Megaphone, href: '/super/broadcasts' },
  { name: 'Growth & safety', icon: Sprout, href: '/super/growth-safety' },
  { name: 'Customers', icon: Users, href: '/customers' },
  { name: 'Rider Fleet', icon: Truck, href: '/riders' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const onSuperAdmin = pathname?.startsWith('/super') ?? false;
  const navItems = onSuperAdmin
    ? menuItems.filter((item) => !item.href.startsWith('/merchant'))
    : menuItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-primary)', borderRadius: '8px' }}></div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>Food Stop Admin</h1>
      </div>

      <nav className="sidebar-nav">
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => {
            const isActive =
              item.href === '/super'
                ? pathname === '/super'
                : pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(`${item.href}/`));
            return (
              <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                <Link 
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    color: isActive ? 'var(--color-sidebar-active)' : 'var(--color-sidebar-text)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <item.icon size={20} />
                    <span style={{ fontWeight: isActive ? '600' : '400' }}>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          color: 'var(--color-sidebar-text)',
          width: '100%',
          padding: '0.75rem 1rem',
          textAlign: 'left'
        }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
