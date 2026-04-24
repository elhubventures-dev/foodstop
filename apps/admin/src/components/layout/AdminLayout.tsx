import React from 'react';
import { Sidebar } from './Sidebar';
import { Search, Bell, User } from 'lucide-react';

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', width: '400px' }}>
            <Search size={18} color="var(--color-text-secondary)" />
            <input 
              type="text" 
              placeholder="Search orders, customers, or menu..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ position: 'relative' }}>
              <Bell size={22} color="var(--color-text-secondary)" />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--color-error)', borderRadius: '50%', border: '2px solid white' }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>Admin User</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Store Manager</p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyItems: 'center', overflow: 'hidden' }}>
                <User size={24} color="var(--color-text-secondary)" style={{ margin: 'auto' }} />
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};
