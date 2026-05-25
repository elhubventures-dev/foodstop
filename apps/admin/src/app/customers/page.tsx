'use client';

import React from 'react';
import { Search, Mail, Phone, MapPin, MoreHorizontal, UserPlus } from 'lucide-react';

export default function CustomersPage() {
  const customers = [
    { id: 1, name: 'Chidi Okonkwo', email: 'chidi.o@example.com', phone: '+234 801 234 5678', location: 'Lekki, Lagos', orders: 12, totalSpent: '₦45,200' },
    { id: 2, name: 'Amina Yusuf', email: 'amina.y@example.com', phone: '+234 902 345 6789', location: 'Wuse, Abuja', orders: 8, totalSpent: '₦32,500' },
    { id: 3, name: 'Tunde Bakare', email: 'tunde.b@example.com', phone: '+234 703 456 7890', location: 'Ikeja, Lagos', orders: 15, totalSpent: '₦58,000' },
    { id: 4, name: 'Efosa Williams', email: 'efosa.w@example.com', phone: '+234 814 567 8901', location: 'GRA, Port Harcourt', orders: 5, totalSpent: '₦18,200' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Customer Directory</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Manage your customer database and view their order history.</p>
        </div>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          backgroundColor: 'var(--color-primary)', 
          color: 'white', 
          border: 'none', 
          padding: '0.75rem 1.25rem', 
          borderRadius: '8px', 
          fontWeight: '600' 
        }}>
          <UserPlus size={18} /> Add New Customer
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search customers by name, email or phone..." 
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Customer</th>
              <th style={{ padding: '1rem 1.5rem' }}>Contact</th>
              <th style={{ padding: '1rem 1.5rem' }}>Location</th>
              <th style={{ padding: '1rem 1.5rem' }}>Orders</th>
              <th style={{ padding: '1rem 1.5rem' }}>Total Spent</th>
              <th style={{ padding: '1rem 1.5rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(200, 65, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                        {customer.name.charAt(0)}
                      </div>
                      <div style={{ fontWeight: '600' }}>{customer.name}</div>
                   </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <Mail size={14} color="#64748b" />
                      <span>{customer.email}</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <Phone size={14} color="#64748b" />
                      <span>{customer.phone}</span>
                   </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <MapPin size={14} color="#64748b" />
                      <span>{customer.location}</span>
                   </div>
                </td>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>{customer.orders}</td>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>{customer.totalSpent}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                   <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <MoreHorizontal size={20} color="#64748b" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
