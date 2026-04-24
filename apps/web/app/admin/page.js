'use client';
import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch Stats
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total, status, created_at');
        
        if (ordersError) throw ordersError;

        const { count: customerCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer');

        if (userError) throw userError;

        // Calculate Revenue
        const totalRevenue = orders
          ?.filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total), 0) || 0;

        const activeOrdersCount = orders?.filter(o => 
          ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
        ).length || 0;

        const avgOrderValue = orders?.length > 0 ? totalRevenue / orders.length : 0;

        setStats([
          { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: 'Active Orders', value: activeOrdersCount.toString(), icon: ShoppingBag },
          { label: 'Total Customers', value: (customerCount || 0).toString(), icon: Users },
          { label: 'Avg. Order Value', value: `₦${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp },
        ]);

        // 2. Fetch Recent Orders
        const { data: recent, error: recentError } = await supabase
          .from('orders')
          .select(`
            id,
            total,
            status,
            created_at,
            profiles:user_id (full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;
        setRecentOrders(recent || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="admin-stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="admin-stat-card">
              <div className="admin-stat-info">
                <span className="admin-stat-label">{stat.label}</span>
                <span className="admin-stat-value">{stat.value}</span>
              </div>
              <div className="admin-stat-icon">
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border-light)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            View All
          </Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <tr key={order.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.id.slice(0, 8).toUpperCase()}</span></td>
                  <td>{order.profiles?.full_name || 'Guest'}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>₦{Number(order.total).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill status-${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
