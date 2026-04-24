'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, User, Mail, ShoppingBag, Calendar, Search } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = useMemo(() => createClient(), []);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch distinct customers from orders table
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name, customer_email, customer_phone, created_at, total_amount')
        .order('created_at', { ascending: false });
      
      if (data) {
        // Group by email to get customer profile
        const customerMap = data.reduce((acc, order) => {
          const email = order.customer_email.toLowerCase();
          if (!acc[email]) {
            acc[email] = {
              name: order.customer_name,
              email: order.customer_email,
              phone: order.customer_phone,
              lastOrder: order.created_at,
              orderCount: 1,
              totalSpent: Number(order.total_amount)
            };
          } else {
            acc[email].orderCount += 1;
            acc[email].totalSpent += Number(order.total_amount);
            if (new Date(order.created_at) > new Date(acc[email].lastOrder)) {
              acc[email].lastOrder = order.created_at;
            }
          }
          return acc;
        }, {});
        
        setCustomers(Object.values(customerMap));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="admin-header" style={{ marginBottom: '2rem' }}>
        <h1>Customer Directory</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>View and manage your customer relationships.</p>
      </div>

      <div style={{ marginBottom: '2rem', position: 'relative' }}>
         <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
         <input 
            type="text" 
            placeholder="Search customers by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: '1rem' }}
         />
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
             <User size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
             <p>No customers found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => (
                <tr key={customer.email}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 600 }}>{customer.name}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}><Mail size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {customer.email}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: 2 }}>{customer.phone}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{customer.orderCount}</td>
                  <td style={{ fontWeight: 600 }}>₦{customer.totalSpent.toLocaleString()}</td>
                  <td style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{new Date(customer.lastOrder).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
