'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Save, Lock, Store, Bell, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Store Settings
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'Food Stop',
    contact_email: 'hello@foodstop.ng',
    contact_phone: '+234 800 000 0000',
    free_delivery_threshold: 20000,
    delivery_fee: 1500,
    is_open: true,
  });

  // Password Change
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .single();
        
        if (data && !error) {
          setStoreSettings(data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [supabase]);

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ ...storeSettings, id: storeSettings.id || 1 });
      
      if (error) throw error;
      toast.success('Store settings updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });
      
      if (error) throw error;
      toast.success('Password updated successfully');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Store Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Profile / Account Section */}
        <section className="card" style={{ padding: '2rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Lock size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '700' }}>Admin Account & Security</h2>
          </div>
          
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: '600' }}>Account Email</label>
              <input 
                type="text" 
                value={user?.email || ''} 
                disabled 
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', cursor: 'not-allowed' }}
              />
            </div>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: '600' }}>New Password</label>
              <input 
                type="password" 
                value={passwords.newPassword}
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                placeholder="Enter new password"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: '600' }}>Confirm New Password</label>
              <input 
                type="password" 
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
              Update Admin Password
            </button>
          </form>
        </section>

        {/* Global Store Settings */}
        <section className="card" style={{ padding: '2rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Store size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '700' }}>General Store Configuration</h2>
          </div>

          <form onSubmit={handleUpdateStore}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: '600' }}>Store Name</label>
              <input 
                type="text" 
                value={storeSettings.store_name}
                onChange={(e) => setStoreSettings({...storeSettings, store_name: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: '600' }}>Delivery Fee (₦)</label>
                <input 
                  type="number" 
                  value={storeSettings.delivery_fee}
                  onChange={(e) => setStoreSettings({...storeSettings, delivery_fee: Number(e.target.value)})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: '600' }}>Free Delivery Over (₦)</label>
                <input 
                  type="number" 
                  value={storeSettings.free_delivery_threshold}
                  onChange={(e) => setStoreSettings({...storeSettings, free_delivery_threshold: Number(e.target.value)})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: '600' }}>Contact Email</label>
              <input 
                type="email" 
                value={storeSettings.contact_email}
                onChange={(e) => setStoreSettings({...storeSettings, contact_email: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="isOpen"
                checked={storeSettings.is_open}
                onChange={(e) => setStoreSettings({...storeSettings, is_open: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isOpen" style={{ fontSize: 'var(--text-sm)', fontWeight: '600', cursor: 'pointer' }}>
                Store is currently accepting orders
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Configuration
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
