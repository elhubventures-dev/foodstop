'use client';
import React from 'react';
import { 
  ShieldCheck, 
  Store, 
  Users, 
  Activity, 
  DollarSign, 
  Settings, 
  ArrowUpRight,
  Server,
  Globe,
  AlertTriangle
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const platformStats = [
    { label: 'Total Branches', value: '12', icon: Store, trend: '+2 this month' },
    { label: 'Active Customers', value: '8.4k', icon: Users, trend: '+12% growth' },
    { label: 'Platform Revenue', value: '₦42.5M', icon: DollarSign, trend: 'MTD Performance' },
    { label: 'System Uptime', value: '99.9%', icon: Activity, trend: 'API Health: Good' },
  ];

  const branches = [
    { name: 'Ikeja Central', status: 'Healthy', revenue: '₦8.2M', staff: 24 },
    { name: 'Lekki Phase 1', status: 'Warning', revenue: '₦12.5M', staff: 32 },
    { name: 'Abuja Wuse 2', status: 'Healthy', revenue: '₦6.8M', staff: 18 },
    { name: 'Port Harcourt', status: 'Maintenance', revenue: '₦4.1M', staff: 14 },
  ];

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ backgroundColor: 'var(--color-primary)', padding: '0.75rem', borderRadius: '12px' }}>
              <ShieldCheck size={28} color="white" />
           </div>
           <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Super Admin Panel</h1>
              <p style={{ color: '#64748b', fontWeight: '500' }}>Global Platform Governance & Control</p>
           </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>System Logs</button>
           <button style={{ backgroundColor: 'black', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Network Config</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
         {platformStats.map((stat, i) => (
           <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                 <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '12px' }}>
                    <stat.icon size={24} color="var(--color-primary)" />
                 </div>
                 <span style={{ fontSize: '0.75rem', color: '#10b981', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: 'full', fontWeight: '700' }}>{stat.trend}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stat.value}</h3>
           </div>
         ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
         <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Branch Network Health</h3>
               <button style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.875rem' }}>View All Locations</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     <th style={{ padding: '1rem' }}>Branch Name</th>
                     <th style={{ padding: '1rem' }}>Health Status</th>
                     <th style={{ padding: '1rem' }}>Monthly Revenue</th>
                     <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {branches.map((branch, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                       <td style={{ padding: '1.25rem 1rem' }}>
                          <div style={{ fontWeight: '700' }}>{branch.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{branch.staff} Staff Members</div>
                       </td>
                       <td style={{ padding: '1.25rem 1rem' }}>
                          <div style={{ 
                             display: 'flex', 
                             alignItems: 'center', 
                             gap: '0.5rem',
                             color: branch.status === 'Healthy' ? '#10b981' : branch.status === 'Warning' ? '#f59e0b' : '#ef4444'
                          }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                             <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{branch.status}</span>
                          </div>
                       </td>
                       <td style={{ padding: '1.25rem 1rem', fontWeight: '700' }}>{branch.revenue}</td>
                       <td style={{ padding: '1.25rem 1rem' }}>
                          <button style={{ color: '#6366f1', fontWeight: '600', fontSize: '0.875rem' }}>Configure</button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ backgroundColor: 'black', borderRadius: '24px', padding: '1.5rem', color: 'white' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Platform Infrastructure</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Server size={18} color="#94a3b8" />
                        <span style={{ fontSize: '0.875rem' }}>API Primary Node</span>
                     </div>
                     <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>ONLINE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Globe size={18} color="#94a3b8" />
                        <span style={{ fontSize: '0.875rem' }}>Edge Distribution</span>
                     </div>
                     <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>14 NODES</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Settings size={18} color="#94a3b8" />
                        <span style={{ fontSize: '0.875rem' }}>Database Sync</span>
                     </div>
                     <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>STABLE</span>
                  </div>
               </div>
               <button style={{ width: '100%', marginTop: '2rem', backgroundColor: '#334155', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '12px', fontWeight: '600' }}>
                  System Overview
               </button>
            </div>

            <div style={{ backgroundColor: '#fff7ed', borderRadius: '24px', padding: '1.5rem', border: '1px solid #ffedd5' }}>
               <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <AlertTriangle size={20} color="#f97316" />
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#9a3412' }}>Global Alerts</h3>
               </div>
               <p style={{ fontSize: '0.875rem', color: '#9a3412', lineHeight: '1.5' }}>
                  New Merchant Application from **Abuja Central (Wuse II)** requires technical vetting and KYC approval.
               </p>
               <button style={{ marginTop: '1rem', color: '#ea580c', fontWeight: '700', fontSize: '0.875rem', textDecoration: 'underline' }}>
                  Review Application
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
