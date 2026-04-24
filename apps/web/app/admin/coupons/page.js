'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle, Tag, Calendar, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage', // 'percentage' | 'fixed'
    discount_value: '',
    min_order_value: 0,
    expiry_date: '',
    is_active: true,
  });
  
  const supabase = useMemo(() => createClient(), []);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openAdd = () => {
    setEditingCoupon(null);
    setFormData({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: 0, expiry_date: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({ ...coupon, discount_value: String(coupon.discount_value) });
    setShowModal(true);
  };

  const saveCoupon = async () => {
    if (!formData.code || !formData.discount_value) return toast.error('Code and value are required');
    
    const payload = {
      ...formData,
      discount_value: Number(formData.discount_value),
      min_order_value: Number(formData.min_order_value) || 0,
      code: formData.code.toUpperCase(),
    };

    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...payload } : c));
      toast.success('Coupon updated');
    } else {
      setCoupons(prev => [{ ...payload, id: Date.now(), created_at: new Date().toISOString() }, ...prev]);
      toast.success('Coupon added');
    }
    setShowModal(false);
  };

  const deleteCoupon = (id) => {
    if (confirm('Delete this coupon?')) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon deleted');
    }
  };

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Coupon Management</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} /></div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
             <Tag size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
             <p>No active coupons. Create one to run a promotion!</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min. Order</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id}>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{coupon.code}</td>
                  <td>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₦${Number(coupon.discount_value).toLocaleString()}`}</td>
                  <td>₦{Number(coupon.min_order_value || 0).toLocaleString()}</td>
                  <td>{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      backgroundColor: coupon.is_active ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                      color: coupon.is_active ? 'var(--color-success)' : 'var(--color-error)'
                    }}>
                      {coupon.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => openEdit(coupon)}><Edit size={16} /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => deleteCoupon(coupon.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', width: '90%', maxWidth: '440px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Coupon Code *</label>
              <input style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="E.G. SAVE20" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Value *</label>
                <input style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Type</label>
                <select style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})}>
                  <option value="percentage">% Off</option>
                  <option value="fixed">Fixed ₦</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Min. Order Value (₦)</label>
              <input style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} type="number" value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: e.target.value})} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Expiry Date</label>
              <input style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
              Coupon is active
            </label>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveCoupon}><Save size={18} /> {editingCoupon ? 'Update Coupon' : 'Create Coupon'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
