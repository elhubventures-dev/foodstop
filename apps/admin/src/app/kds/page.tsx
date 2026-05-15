'use client';
import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Timer,
  ChefHat,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@chopfast/shared';

export default function KDSPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomingOrders();
    
    // Real-time updates for kitchen
    const channel = supabase
      .channel('kds-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        fetchIncomingOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIncomingOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    if (!error) {
      fetchIncomingOrders();
    }
  };

  const getWaitTime = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000); // minutes
    return diff;
  };

  return (
    <div style={{ 
      backgroundColor: '#0f172a', 
      minHeight: '100vh', 
      padding: '1.5rem',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* KDS Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f97316', padding: '0.75rem', borderRadius: '12px' }}>
            <ChefHat size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Kitchen Display System</h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Branch: Ikeja Central</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
           <p style={{ color: '#22c55e', margin: 0, fontSize: '0.875rem' }}>● Kitchen Live</p>
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {orders.map((order) => {
          const waitMinutes = getWaitTime(order.created_at);
          const isLate = waitMinutes > 20;

          return (
            <div key={order.id} style={{ 
              backgroundColor: '#1e293b', 
              borderRadius: '20px', 
              overflow: 'hidden',
              border: isLate ? '2px solid #ef4444' : '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Card Header */}
              <div style={{ 
                padding: '1.25rem', 
                backgroundColor: isLate ? '#450a0a' : '#0f172a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>#{order.id.slice(0, 5).toUpperCase()}</h2>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>{order.customer_name || 'Guest User'}</p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  backgroundColor: isLate ? '#ef4444' : '#334155',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '10px'
                }}>
                  <Timer size={18} />
                  <span style={{ fontWeight: 'bold' }}>{waitMinutes}m</span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ padding: '1.25rem', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {/* In a real app, map order.items */}
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                         <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f97316' }}>2x</span>
                         <div>
                            <p style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>Jollof Rice (Party Style)</p>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '4px 0 0' }}>+ Extra Pepper, No Onions</p>
                         </div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                         <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f97316' }}>1x</span>
                         <div>
                            <p style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>Assorted Meat Grill</p>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '4px 0 0' }}>Medium Spice</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Action Footer */}
              <div style={{ padding: '1.25rem', borderTop: '1px solid #334155', display: 'flex', gap: '1rem' }}>
                {order.status === 'pending' ? (
                  <button 
                    onClick={() => updateStatus(order.id, 'preparing')}
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#3b82f6', 
                      color: 'white', 
                      border: 'none', 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    START COOKING
                  </button>
                ) : (
                  <button 
                    onClick={() => updateStatus(order.id, 'ready')}
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#22c55e', 
                      color: 'white', 
                      border: 'none', 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle2 size={20} />
                    READY FOR PICKUP
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {orders.length === 0 && !loading && (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '100px',
            color: '#475569'
          }}>
            < ChefHat size={80} style={{ marginBottom: '20px', opacity: 0.2 }} />
            <h2 style={{ fontSize: '2rem' }}>Kitchen is Clear!</h2>
            <p>No pending orders at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
