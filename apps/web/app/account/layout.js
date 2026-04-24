'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, ShoppingBag, MapPin, Heart, Settings, LogOut } from 'lucide-react';
import './account.css';

const navItems = [
  { name: 'Dashboard', href: '/account', icon: LayoutDashboard },
  { name: 'Orders', href: '/account/orders', icon: ShoppingBag },
  { name: 'Addresses', href: '/account/addresses', icon: MapPin },
  { name: 'Favorites', href: '/account/favorites', icon: Heart },
  { name: 'Settings', href: '/account/settings', icon: Settings },
];

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="container account-layout">
      <aside className="account-sidebar">
        <nav className="account-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`account-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="icon" />
                {item.name}
              </Link>
            );
          })}
          
          <button 
            onClick={signOut}
            className="account-nav-link"
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', marginTop: '1rem', color: 'var(--color-text-error)' }}
          >
            <LogOut className="icon" />
            Sign Out
          </button>
        </nav>
      </aside>
      
      <div className="account-content">
        {children}
      </div>
    </div>
  );
}
