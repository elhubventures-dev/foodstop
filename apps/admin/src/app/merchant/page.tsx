'use client';
import React from 'react';
import { 
  Users, 
  MapPin, 
  Package, 
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function MerchantPortalPage() {
  const branchData = {
    name: 'Ikeja Branch',
    manager: 'Oluwaseun Adewale',
    status: 'Open',
    staffCount: 12,
    activeOrders: 8,
    todayRevenue: '₦84,200',
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            <MapPin size={18} />
            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>MERCHANT PORTAL</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{branchData.name} Management</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back, {branchData.manager}. Manage your staff and local menu here.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="btn btn-secondary">Update Status</button>
           <button className="btn btn-primary">Branch Settings</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
           <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Daily Revenue</p>
           <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{branchData.todayRevenue}</h3>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              <TrendingUp size={14} />
              <span>+15% vs yesterday</span>
           </div>
        </div>
        <div className="card">
           <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Branch Staff</p>
           <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{branchData.staffCount} Active</h3>
           <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>2 on break</p>
        </div>
        <div className="card">
           <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Avg. Prep Time</p>
           <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>18m</h3>
           <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Goal: 15m</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
         <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
               <h3 style={{ fontWeight: '600' }}>Branch Staff Directory</h3>
               <button style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '600' }}>Add Staff</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                     <th style={{ padding: '1rem 1.5rem' }}>Name</th>
                     <th style={{ padding: '1rem 1.5rem' }}>Role</th>
                     <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                     <th style={{ padding: '1rem 1.5rem' }}>Today's Orders</th>
                  </tr>
               </thead>
               <tbody>
                  {[
                    { name: 'Kemi Adebayo', role: 'Head Chef', status: 'In Kitchen', orders: '-' },
                    { name: 'Tunde Bakare', role: 'Kitchen Asst.', status: 'Active', orders: '14' },
                    { name: 'Chioma Okeke', role: 'Front Desk', status: 'On Break', orders: '-' },
                    { name: 'Ibrahim Musa', role: 'Packer', status: 'Active', orders: '28' },
                  ].map((staff, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                       <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{staff.name}</td>
                       <td style={{ padding: '1rem 1.5rem' }}>{staff.role}</td>
                       <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ 
                             padding: '0.25rem 0.6rem', 
                             borderRadius: '99px', 
                             fontSize: '0.7rem', 
                             fontWeight: '600',
                             backgroundColor: staff.status === 'Active' ? '#f0fdf4' : '#fef2f2',
                             color: staff.status === 'Active' ? '#16a34a' : '#dc2626'
                          }}>{staff.status}</span>
                       </td>
                       <td style={{ padding: '1rem 1.5rem' }}>{staff.orders}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div className="card">
            <h3 style={{ fontWeight: '600', marginBottom: '1.5rem' }}>Branch Inventory Alerts</h3>
            {[
              { item: 'Basmati Rice', stock: 'Low (15kg)', color: 'var(--color-warning)' },
              { item: 'Vegetable Oil', stock: 'Critical (2L)', color: 'var(--color-error)' },
              { item: 'Chicken Breast', stock: 'Normal (45kg)', color: 'var(--color-success)' },
              { item: 'Scotch Bonnet', stock: 'Out of Stock', color: 'var(--color-error)' },
            ].map((inv, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: inv.color }}></div>
                    <span style={{ fontWeight: '500' }}>{inv.item}</span>
                 </div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{inv.stock}</span>
              </div>
            ))}
            <button style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontWeight: '600' }}>
               Manage Inventory
            </button>
         </div>
      </div>
    </div>
  );
}
