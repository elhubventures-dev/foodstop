'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@chopfast/shared';
import { User, Shield, ShieldCheck, Mail, Edit2, Save, X } from 'lucide-react';

type StaffUser = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
};

export default function StaffPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: editRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: editRole } : u));
      setEditingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Staff & Role Management</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage access levels for your team members and customers.</p>
      </div>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading staff...</p>}

      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Email/ID</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--color-primary-light)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                    <span style={{ fontWeight: '600' }}>{u.full_name || 'Anonymous User'}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} />
                    <span>{u.id.slice(0, 12)}...</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {editingId === u.id ? (
                    <select 
                      value={editRole} 
                      onChange={(e) => setEditRole(e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {u.role === 'admin' ? (
                        <ShieldCheck size={16} color="#059669" />
                      ) : u.role === 'staff' ? (
                        <Shield size={16} color="var(--color-primary)" />
                      ) : (
                        <User size={16} color="#94a3b8" />
                      )}
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: u.role === 'admin' ? '#059669' : u.role === 'staff' ? 'var(--color-primary)' : '#475569'
                      }}>
                        {u.role?.toUpperCase() || 'CUSTOMER'}
                      </span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {editingId === u.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleUpdateRole(u.id)} style={{ color: '#059669' }}><Save size={18} /></button>
                      <button onClick={() => setEditingId(null)} style={{ color: 'var(--color-error)' }}><X size={18} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setEditingId(u.id); setEditRole(u.role || 'customer'); }}
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
