'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import Link from 'next/link';

export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', text: '#d97706', icon: Clock };
      case 'preparing': return { bg: '#dcf6ff', text: '#0284c7', icon: ShoppingBag };
      case 'ready': return { bg: '#ecfdf5', text: '#059669', icon: CheckCircle2 };
      case 'out_for_delivery': return { bg: '#f5f3ff', text: '#7c3aed', icon: ShoppingBag };
      case 'delivered': return { bg: '#f0fdf4', text: '#16a34a', icon: CheckCircle2 };
      case 'cancelled': return { bg: '#fef2f2', text: '#dc2626', icon: AlertCircle };
      default: return { bg: '#f8fafc', text: '#64748b', icon: Clock };
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Order Management</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Track and manage all customer orders in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button style={{ 
             display: 'flex', 
             alignItems: 'center', 
             gap: '0.5rem', 
             backgroundColor: 'white', 
             border: '1px solid var(--color-border)', 
             padding: '0.6rem 1rem', 
             borderRadius: '8px', 
             fontWeight: '600',
             fontSize: '0.875rem'
           }}>
             <ArrowUpDown size={16} /> Export CSV
           </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'].map((s) => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '99px', 
                  fontSize: '0.875rem', 
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  backgroundColor: filter === s ? 'var(--color-primary)' : 'transparent',
                  color: filter === s ? 'white' : 'var(--color-text-secondary)',
                  border: filter === s ? 'none' : '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.6rem 1rem 0.6rem 2.5rem', 
                borderRadius: '8px', 
                border: '1px solid var(--color-border)', 
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Order</th>
              <th style={{ padding: '1rem 1.5rem' }}>Customer</th>
              <th style={{ padding: '1rem 1.5rem' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem' }}>Items</th>
              <th style={{ padding: '1rem 1.5rem' }}>Total</th>
              <th style={{ padding: '1rem 1.5rem' }}>Date & Time</th>
              <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>Loading orders...</span>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const status = getStatusColor(order.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontWeight: '700', fontFamily: 'monospace', color: 'var(--color-primary)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: '600' }}>{order.customer_name || 'Guest Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{order.customer_email || 'No email'}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        padding: '0.35rem 0.75rem', 
                        borderRadius: '99px', 
                        backgroundColor: status.bg, 
                        color: status.text,
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'capitalize'
                      }}>
                        <StatusIcon size={14} />
                        {order.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                       <span style={{ fontWeight: '500' }}>{order.item_count || 1} items</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>
                      ₦{Number(order.total).toLocaleString()}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                       <div style={{ fontWeight: '500' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link href={`/orders/${order.id}`} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                             <Eye size={16} />
                          </Link>
                          <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                             <MoreVertical size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                   <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                   <p style={{ fontWeight: '600' }}>No orders found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
             Showing <b>{filteredOrders.length}</b> of <b>{orders.length}</b> orders
           </span>
           <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button disabled style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', opacity: 0.5 }}><ChevronLeft size={16} /></button>
              <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}><ChevronRight size={16} /></button>
           </div>
        </div>
      </div>
    </div>
  );
}
