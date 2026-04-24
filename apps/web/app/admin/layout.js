'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Users, 
  Tags, 
  Settings,
  Menu as MenuIcon,
  X,
  LogOut,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import './admin.css';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Live Orders', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Menu & Categories', href: '/admin/menu', icon: UtensilsCrossed },
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Coupons', href: '/admin/coupons', icon: Tags },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { name: 'Store Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!loading && (!user || !isAdmin)) {
      router.push('/admin/login');
    }
  }, [user, isAdmin, loading, router, pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <Loader2 className="animate-spin" size={40} color="#0ea5e9" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleLogout = async () => {
    const logoutToast = toast.loading('Signing out...');
    try {
      await signOut();
      toast.success('Signed out successfully', { id: logoutToast });
      router.push('/admin/login');
    } catch (err) {
      toast.error('Sign out failed', { id: logoutToast });
    }
  };

  return (
    <>
      {/* Mobile Toggle removed as requested */}

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-layout">
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {navGroups.map((group, i) => (
            <div key={i} className="admin-nav-group">
              <h3 className="admin-nav-title">{group.title}</h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      className={`admin-nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={20} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Admin Logout */}
          <div className="admin-nav-group sign-out-section">
             <button 
               onClick={handleLogout}
               className="admin-nav-link sign-out-btn"
               style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
             >
               <LogOut size={20} />
               Sign Out
             </button>
          </div>
        </aside>

        <main className="admin-main">
          {children}
        </main>
      </div>
    </>
  );
}
