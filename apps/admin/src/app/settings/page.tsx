'use client';

import React from 'react';
import { Bell, Shield, CreditCard, Store, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Settings</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Configure your restaurant profile, notification preferences and platform security.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '3rem' }}>
        <aside>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { name: 'General', icon: Store, active: true },
              { name: 'Notifications', icon: Bell, active: false },
              { name: 'Security', icon: Shield, active: false },
              { name: 'Payments', icon: CreditCard, active: false },
              { name: 'Language & Region', icon: Globe, active: false },
            ].map((item) => (
              <button 
                key={item.name}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '10px', 
                  backgroundColor: item.active ? 'rgba(200, 65, 11, 0.1)' : 'transparent',
                  color: item.active ? 'var(--color-primary)' : '#64748b',
                  border: 'none',
                  fontWeight: '600',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <item.icon size={20} />
                {item.name}
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
             <h3 style={{ fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>Store Profile</h3>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Restaurant Name</label>
                   <input type="text" defaultValue="Food Stop Central" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Contact Email</label>
                   <input type="email" defaultValue="hello@foodstop.com" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Business Phone</label>
                   <input type="text" defaultValue="+234 801 234 5678" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Opening Hours</label>
                   <input type="text" defaultValue="08:00 AM - 10:00 PM" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
             </div>

             <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Address</label>
                <textarea rows={3} defaultValue="12, Adeola Odeku Street, Victoria Island, Lagos, Nigeria" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }} />
             </div>
          </div>

          <div className="card">
             <h3 style={{ fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>Display Settings</h3>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                   <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Maintenance Mode</p>
                   <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Temporarily disable ordering on the website and app.</p>
                </div>
                <div style={{ width: '48px', height: '24px', backgroundColor: '#e2e8f0', borderRadius: '12px', position: 'relative' }}>
                   <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', left: '2px', top: '2px' }}></div>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <button style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: '600' }}>Cancel</button>
             <button style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '0.5rem', 
               padding: '0.75rem 1.5rem', 
               borderRadius: '8px', 
               border: 'none', 
               backgroundColor: 'var(--color-primary)', 
               color: 'white', 
               fontWeight: '600' 
             }}>
                <Save size={18} /> Save Changes
             </button>
          </div>
        </main>
      </div>
    </div>
  );
}
