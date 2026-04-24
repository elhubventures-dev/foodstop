'use client';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AccountDashboard() {
  const { profile } = useAuth();
  
  // Mock data since we aren't fetching the real DB yet
  const stats = [
    { label: 'Total Orders', value: '12', icon: ShoppingBag },
    { label: 'Loyalty Points', value: '450', icon: TrendingUp },
    { label: 'Reviews Given', value: '5', icon: Star },
  ];

  const recentOrders = [
    { id: 'ORD-1234', date: 'Oct 24, 2026', total: 6500, status: 'Delivered', items: 'Jollof Rice, Plantain' },
    { id: 'ORD-1233', date: 'Oct 12, 2026', total: 4200, status: 'Delivered', items: 'Pounded Yam, Egusi' },
  ];

  return (
    <div>
      <div className="account-header">
        <h1>Welcome back, {profile?.full_name?.split(' ')[0] || 'Guest'} 👋</h1>
        <p>Here&apos;s an overview of your recent activity at FOOD STOP.</p>
      </div>

      <div className="dashboard-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card">
              <Icon className="stat-icon" size={24} />
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="recent-orders">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Orders</h2>
        <div className="data-list">
          {recentOrders.map((order, i) => (
            <div key={i} className="data-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{order.id}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  {order.date} • {order.items}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600' }}>₦{order.total.toLocaleString()}</div>
                <div style={{ 
                  color: order.status === 'Delivered' ? 'var(--color-success)' : 'var(--color-primary)',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {order.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Link 
          href="/account/orders" 
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: '1rem' }}
        >
          View All Orders
        </Link>
      </div>
    </div>
  );
}
