'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
// import { supabase } from '@chopfast/shared'; // We'll enable this once linked

export default function MenuManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items] = useState([
    { id: '101', name: 'Party Jollof Rice', category: 'Rice Dishes', price: 3500, status: 'available', image: '/jollof.jpg' },
    { id: '102', name: 'Pounded Yam & Egusi', category: 'Swallow', price: 4200, status: 'available', image: '/egusi.jpg' },
    { id: '103', name: 'Beef Suya', category: 'Grills', price: 3000, status: 'out_of_stock', image: '/suya.jpg' },
    { id: '104', name: 'Afang Soup', category: 'Soups', price: 3000, status: 'available', image: '/afang.jpg' },
  ]);

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Menu Management</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Create, edit, and manage your restaurant&apos;s food offerings.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          <span>Add New Item</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by name, category, or ID..." 
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.5rem', 
                borderRadius: '8px', 
                border: '1px solid var(--color-border)',
                outline: 'none',
                fontSize: '0.875rem'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '8px', 
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            <Filter size={18} />
            <span>Category</span>
            <ChevronDown size={16} />
          </button>
          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '8px', 
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            <span>Status</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Item</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Price</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <span style={{ fontSize: '1.25rem' }}>🍲</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: '600' }}>{item.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ID: {item.id}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{item.category}</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: '600' }}>₦{item.price.toLocaleString()}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.status === 'available' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: '600' }}>
                        <Eye size={14} /> Available
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>
                        <EyeOff size={14} /> Out of Stock
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={{ color: 'var(--color-text-secondary)', padding: '0.25rem' }}><Edit2 size={18} /></button>
                    <button style={{ color: 'var(--color-error)', padding: '0.25rem' }}><Trash2 size={18} /></button>
                    <button style={{ color: 'var(--color-text-secondary)', padding: '0.25rem' }}><MoreVertical size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Showing 4 of 32 items</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'white', fontSize: '0.875rem' }}>Previous</button>
             <button style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'white', fontSize: '0.875rem' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
