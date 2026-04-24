'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  'pending', 'confirmed', 'preparing', 'ready',
  'out_for_delivery', 'delivered', 'cancelled', 'refunded'
];

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name),
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Order updated to ${newStatus}`);
      
      // Update local state to reflect change
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update status');
    }
  };

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Live Orders</h1>
        <button className="btn btn-secondary" onClick={fetchOrders} disabled={loading}>
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize', whiteSpace: 'nowrap', fontSize: '0.875rem' }}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Time</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}>
                  <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>{order.id.slice(0, 8).toUpperCase()}</span></td>
                  <td>{order.profiles?.full_name || 'Guest'}</td>
                  <td>{order.order_items?.map(it => `${it.quantity}x ${it.name}`).join(', ') || 'No items'}</td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>₦{Number(order.total_amount).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill status-${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <select 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', outline: 'none' }}
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
                  No {activeTab !== 'all' ? activeTab : ''} orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
