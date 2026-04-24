'use client';
import React, { useState } from 'react';
import { 
  Banknote, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronRight,
  Download
} from 'lucide-react';

export default function MerchantPayoutsPage() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const stats = {
    totalEarnings: '₦1,420,500',
    currentBalance: '₦184,200',
    pendingPayout: '₦45,000',
    lastPayout: '₦120,000 (2 days ago)',
  };

  const payoutHistory = [
    { id: '1', date: '2026-04-21', amount: '₦120,000', status: 'Completed', bank: 'Access Bank' },
    { id: '2', date: '2026-04-14', amount: '₦215,000', status: 'Completed', bank: 'Access Bank' },
    { id: '3', date: '2026-04-07', amount: '₦98,500', status: 'Failed', bank: 'GTBank' },
    { id: '4', date: '2026-03-31', amount: '₦150,000', status: 'Completed', bank: 'GTBank' },
  ];

  const handleWithdraw = () => {
    setIsWithdrawing(true);
    setTimeout(() => {
      alert('Withdrawal request for ₦184,200 submitted to Paystack. Settlement will be completed within 24 hours.');
      setIsWithdrawing(false);
    }, 2000);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Payouts & Settlements</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Manage your branch earnings and request bank transfers.</p>
        </div>
        <button 
           className="btn btn-primary" 
           onClick={handleWithdraw}
           disabled={isWithdrawing}
           style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Banknote size={18} />
          {isWithdrawing ? 'Processing...' : 'Withdraw Balance'}
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
           <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Current Balance</p>
           <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.currentBalance}</h3>
           <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.5rem' }}>Available for withdrawal</p>
        </div>
        <div className="card">
           <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Earnings</p>
           <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalEarnings}</h3>
           <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Lifetime revenue</p>
        </div>
        <div className="card">
           <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Pending Settlements</p>
           <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pendingPayout}</h3>
           <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>1 transaction in progress</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '600' }}>Withdrawal History</h3>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
               <Download size={16} />
               Export CSV
            </button>
         </div>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Reference</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Bank Account</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Amount</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Status</th>
               </tr>
            </thead>
            <tbody>
               {payoutHistory.map((payout, i) => (
                 <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>{payout.date}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>TRF_{Math.random().toString(36).substring(7).toUpperCase()}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={14} color="var(--color-text-secondary)" />
                          <span>{payout.bank} • 1234</span>
                       </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{payout.amount}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                       <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          color: payout.status === 'Completed' ? '#16a34a' : payout.status === 'Failed' ? '#dc2626' : '#d97706'
                       }}>
                          {payout.status === 'Completed' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{payout.status}</span>
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div style={{ marginTop: '2rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
         <div style={{ backgroundColor: '#e2e8f0', padding: '0.75rem', borderRadius: '12px' }}>
            <AlertCircle size={24} color="#64748b" />
         </div>
         <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Settlements are processed every Tuesday and Friday. For urgent withdrawals, please contact the main administrator.
         </p>
      </div>
    </div>
  );
}
