'use client';

import React from 'react';
import { Truck, MapPin, Star, Clock, Phone, MoreVertical, Plus } from 'lucide-react';

export default function RidersPage() {
  const riders = [
    { id: 1, name: 'Ibrahim Suleiman', status: 'On Delivery', battery: '85%', rating: 4.8, orders: 156, currentTask: '#ORD-8392' },
    { id: 2, name: 'Blessing Udoh', status: 'Available', battery: '92%', rating: 4.9, orders: 242, currentTask: 'Waiting...' },
    { id: 3, name: 'Samuel Adeyemi', status: 'Off Duty', battery: '12%', rating: 4.7, orders: 189, currentTask: '-' },
    { id: 4, name: 'Grace Emmanuel', status: 'On Delivery', battery: '64%', rating: 4.9, orders: 310, currentTask: '#ORD-8401' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Rider Fleet</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Monitor and manage your delivery partners and their performance.</p>
        </div>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          backgroundColor: 'black', 
          color: 'white', 
          border: 'none', 
          padding: '0.75rem 1.25rem', 
          borderRadius: '12px', 
          fontWeight: '600' 
        }}>
          <Plus size={18} /> Onboard New Rider
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {riders.map((rider) => (
          <div key={rider.id} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Truck size={28} color="var(--color-primary)" />
                  </div>
                  <div>
                     <h4 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{rider.name}</h4>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: rider.status === 'Available' ? 'var(--color-success)' : rider.status === 'On Delivery' ? 'var(--color-primary)' : '#64748b' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                        {rider.status}
                     </div>
                  </div>
               </div>
               <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <MoreVertical size={18} color="#94a3b8" />
               </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
               <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Rating</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '700' }}>
                     <Star size={14} fill="#f59e0b" color="#f59e0b" />
                     {rider.rating}
                  </div>
               </div>
               <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Battery</p>
                  <div style={{ fontWeight: '700' }}>{rider.battery}</div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
               <div style={{ color: '#64748b' }}>Current Task:</div>
               <div style={{ fontWeight: '700', color: rider.currentTask.startsWith('#') ? 'var(--color-primary)' : 'inherit' }}>{rider.currentTask}</div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
               <button style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                  <Phone size={14} /> Call
               </button>
               <button style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                  <MapPin size={14} /> Track
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
