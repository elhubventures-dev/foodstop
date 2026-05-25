'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@chopfast/shared';

type OrderDetail = {
  id: string;
  status: string;
  created_at: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: { street?: string; address?: string } | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  total?: number | null;
};

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();
        
      if (data) setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, [resolvedParams.id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date() })
      .eq('id', resolvedParams.id);
      
    if (!error) {
      setOrder((current) => current ? { ...current, status: newStatus } : current);
    }
    setUpdating(false);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading order details...</div>;
  if (!order) return <div style={{ padding: '2rem' }}>Order not found.</div>;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <button 
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', border: 'none', background: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Order #{order.id.slice(0, 8)}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
             <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Placed on {new Date(order.created_at).toLocaleString()}</span>
             <span style={{ 
               padding: '0.25rem 0.75rem', 
               borderRadius: '99px', 
               fontSize: '0.75rem', 
               fontWeight: '600',
               backgroundColor: 'var(--color-primary-light)',
               color: 'var(--color-primary)'
             }}>
               {order.status.toUpperCase()}
             </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {order.status === 'pending' && (
            <button 
              onClick={() => updateStatus('preparing')} 
              disabled={updating}
              className="btn btn-primary"
            >
              Confirm & Start Preparing
            </button>
          )}
          {order.status === 'preparing' && (
            <button 
              onClick={() => updateStatus('ready')} 
              disabled={updating}
              className="btn btn-primary"
            >
              Mark as Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button 
              onClick={() => updateStatus('out_for_delivery')} 
              disabled={updating}
              className="btn btn-primary"
            >
              Hand over to Rider
            </button>
          )}
          <button className="btn btn-secondary">Print Receipt</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Customer & Delivery Info */}
          <div className="card">
             <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <User size={20} /> Customer Information
             </h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                   <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Customer Name</p>
                   <p style={{ fontWeight: '600' }}>{order.customer_name || 'Guest'}</p>
                </div>
                <div>
                   <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Phone Number</p>
                   <p style={{ fontWeight: '600' }}>{order.customer_phone || 'N/A'}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                   <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Delivery Address</p>
                   <p style={{ fontWeight: '600', lineHeight: '1.5' }}>{order.delivery_address?.street || '12 Wuse 2 Road, Abuja'}</p>
                </div>
             </div>
          </div>

          {/* Order Items */}
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: '600' }}>Order Items</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
               {/* Simplified mock items for now, ideally fetch from order_items */}
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontWeight: '700' }}>2x</span> Party Jollof Rice
                  </div>
                  <span style={{ fontWeight: '600' }}>₦7,000</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: '700' }}>1x</span> Beef Suya Platter
                  </div>
                  <span style={{ fontWeight: '600' }}>₦3,000</span>
               </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Payment Info */}
          <div className="card">
             <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} /> Payment Summary
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                   <span>₦{order.subtotal?.toLocaleString() || '10,000'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span style={{ color: 'var(--color-text-secondary)' }}>Delivery Fee</span>
                   <span>₦{order.delivery_fee?.toLocaleString() || '1,500'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: '800', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
                   <span>Total</span>
                   <span>₦{order.total?.toLocaleString()}</span>
                </div>
             </div>
             <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.875rem' }}>
                <CheckCircle2 size={16} /> Paid via Paystack
             </div>
          </div>

          {/* Timeline */}
          <div className="card">
             <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Activity Timeline</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '4px' }} />
                   <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>Order Placed</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{new Date(order.created_at).toLocaleTimeString()}</p>
                   </div>
                </div>
                {order.status !== 'pending' && (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '4px' }} />
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>Preparing Started</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Few minutes ago</p>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
