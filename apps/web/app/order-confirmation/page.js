'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MapPin, Clock, Phone, ReceiptText, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || 'ORD-8271'; // Fallback for demo

  const steps = [
    { label: 'Confirmed', status: 'completed', icon: CheckCircle },
    { label: 'Preparing', status: 'current', icon: Clock },
    { label: 'Out for Delivery', status: 'upcoming', icon: MapPin },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1a1a1a' }}>Order Confirmed!</h1>
        <p style={{ color: '#666', fontSize: '1.125rem' }}>
          Your order <strong>{orderId}</strong> is being prepared with love.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', textAlign: 'left' }}>
        <div>
          {/* Status Stepper */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
             <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Delivery Status</h3>
             <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {steps.map((step, idx) => (
                   <div key={idx} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: step.status === 'completed' ? '#10b981' : step.status === 'current' ? 'var(--color-primary)' : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.5rem',
                        color: 'white'
                      }}>
                        <step.icon size={16} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: step.status === 'upcoming' ? '#9ca3af' : '#1a1a1a' }}>{step.label}</span>
                      
                      {idx < steps.length - 1 && (
                         <div style={{ 
                           position: 'absolute', 
                           top: '16px', 
                           left: '50%', 
                           width: '100%', 
                           height: '2px', 
                           backgroundColor: step.status === 'completed' ? '#10b981' : '#e5e7eb',
                           zIndex: -1 
                         }} />
                      )}
                   </div>
                ))}
             </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
             <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Delivery Details</h3>
             <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--color-primary)' }}><MapPin size={20} /></div>
                <div>
                   <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>Delivery Address</p>
                   <p style={{ color: '#666', fontSize: '0.875rem' }}>12 Wuse 2 Road, Abuja, Nigeria</p>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: 'var(--color-primary)' }}><Phone size={20} /></div>
                <div>
                   <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>Contact Info</p>
                   <p style={{ color: '#666', fontSize: '0.875rem' }}>+234 812 345 6789</p>
                </div>
             </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fafafa' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <ReceiptText size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Order Summary</h3>
             </div>
             <div style={{ borderBottom: '1px dashed #ddd', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                   <span>2x Party Jollof Rice</span>
                   <span style={{ fontWeight: '600' }}>₦7,000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span>1x Beef Suya Platter</span>
                   <span style={{ fontWeight: '600' }}>₦3,000</span>
                </div>
             </div>
             <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                   <span>Subtotal</span>
                   <span>₦10,000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#666' }}>
                   <span>Delivery Fee</span>
                   <span>₦1,500</span>
                </div>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                <span>Total</span>
                <span>₦11,500</span>
             </div>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <Link href="/menu" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}>
              Order Something Else <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmation() {
  return (
    <div className="container" style={{ padding: '6rem 0', minHeight: '80vh' }}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Loading order details...</div>}>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
