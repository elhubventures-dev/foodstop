'use client';
import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import { useStats } from '@/hooks/useStats';

export default function DashboardPage() {
  const { orders, loading: ordersLoading } = useOrders();
  const { stats, loading: statsLoading } = useStats();

  const dashboardStats = [
    { 
      name: "Today's Revenue", 
      value: stats ? `₦${stats.revenue.toLocaleString()}` : "₦0", 
      change: stats ? `${stats.revenueGrowth}%` : "0%", 
      icon: TrendingUp, 
      trend: stats && parseFloat(stats.revenueGrowth) >= 0 ? 'up' : 'down' 
    },
    { 
      name: "Active Orders", 
      value: stats ? stats.activeOrders.toString() : "0", 
      change: stats ? `+${stats.todayCount} today` : "0", 
      icon: ShoppingBag, 
      trend: 'up' 
    },
    { 
      name: "Total Customers", 
      value: stats ? stats.totalCustomers.toString() : "0", 
      change: "+4%", 
      icon: Users, 
      trend: 'up' 
    },
    { 
      name: "Avg. Prep Time", 
      value: "22m", 
      change: "-2m", 
      icon: Clock, 
      trend: 'down' 
    },
  ];
  return (
    <div style={{ position: 'relative' }}>
      {(ordersLoading || statsLoading) && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(255,255,255,0.5)', 
          zIndex: 10, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #f1f5f9', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      )}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Dashboard Overview</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back! Here is what is happening with your restaurant today.</p>
      </div>

      <div className="stats-grid">
        {dashboardStats.map((stat) => (
          <div key={stat.name} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{stat.name}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{stat.value}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: stat.trend === 'up' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.change} vs yesterday</span>
              </div>
            </div>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: 'rgba(200, 65, 11, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '600' }}>Revenue Overview</h3>
          <select style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
             <option>Last 7 Days</option>
             <option>Last 30 Days</option>
          </select>
        </div>
        <div style={{ padding: '2rem', height: '300px', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
           {[45, 62, 58, 75, 90, 70, 85].map((height, i) => (
             <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '100%', 
                  height: `${height}%`, 
                  backgroundColor: i === 4 ? 'var(--color-primary)' : 'rgba(200, 65, 11, 0.2)', 
                  borderRadius: '6px 6px 0 0',
                  position: 'relative'
                }}>
                   {i === 4 && (
                     <div style={{ 
                       position: 'absolute', 
                       top: '-25px', 
                       left: '50%', 
                       transform: 'translateX(-50%)', 
                       fontSize: '0.75rem', 
                       fontWeight: '700'
                     }}>₦12k</div>
                   )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
             </div>
           ))}
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '600' }}>Recent Orders</h3>
          <button style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '600' }}>View All Orders</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Order ID</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Customer</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Items</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Time</th>
              <th style={{ padding: '1rem 1.5rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>
                  <Link href={`/orders/${order.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    #{order.id.slice(0, 8)}
                  </Link>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>{order.customer_name || 'Guest Customer'}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{order.item_count || 1} items</td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>₦{order.total.toLocaleString()}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '99px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    backgroundColor: order.status === 'preparing' ? 'rgba(245, 158, 11, 0.1)' : 
                                     order.status === 'ready' ? 'rgba(16, 185, 129, 0.1)' : 
                                     'rgba(148, 163, 184, 0.1)',
                    color: order.status === 'preparing' ? 'var(--color-warning)' : 
                           order.status === 'ready' ? 'var(--color-success)' : 
                           'var(--color-text-secondary)'
                  }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <MoreHorizontal size={20} color="var(--color-text-secondary)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div className="card">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontWeight: '600' }}>Top Selling Items</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {[
              { name: 'Jollof Rice Special', sales: 124, growth: '+12%', color: '#f59e0b' },
              { name: 'Egusi Soup & Pounded Yam', sales: 98, growth: '+5%', color: '#10b981' },
              { name: 'Beef Suya (Large)', sales: 86, growth: '+18%', color: '#ef4444' },
              { name: 'Puff Puff Basket', sales: 72, growth: '-2%', color: '#6366f1' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.925rem' }}>{item.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.sales} portions sold</p>
                  </div>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: item.growth.startsWith('+') ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {item.growth}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontWeight: '600' }}>Peak Order Hours</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
              {Array.from({ length: 84 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div 
                    key={i} 
                    style={{ 
                      aspectRatio: '1', 
                      borderRadius: '3px', 
                      backgroundColor: `rgba(200, 65, 11, ${intensity})`,
                      cursor: 'pointer'
                    }} 
                    title={`${Math.floor(intensity * 100)} orders`}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span>8 AM</span>
              <span>12 PM</span>
              <span>4 PM</span>
              <span>8 PM</span>
              <span>12 AM</span>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="var(--color-success)" />
              <p style={{ fontSize: '0.875rem' }}>Orders peak between <b>6 PM and 8 PM</b> daily.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
