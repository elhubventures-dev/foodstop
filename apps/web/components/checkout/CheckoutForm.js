'use client';

import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useRouter } from 'next/navigation';

import { useCartStore } from '@chopfast/shared';

export default function CheckoutForm() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  
  const [email, setEmail] = useState('customer@example.com');
  const [address, setAddress] = useState('12 Wuse 2 Road, Abuja');
  const [name, setName] = useState('John Doe');
  
  const subtotal = getTotal();
  const deliveryFee = 1500;
  const total = subtotal + deliveryFee;

  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: total * 100, // Paystack expects amount in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference) => {
    console.log('Payment successful. Reference:', reference);
    // In a real app, send this reference to the backend/Supabase to verify and create the order
    clearCart();
    alert('Payment Successful! Your order has been placed.');
    router.push('/order-confirmation');
  };

  const onClose = () => {
    console.log('Payment closed');
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!email || !address || !name) {
      alert('Please fill out all delivery details');
      return;
    }
    initializePayment(onSuccess, onClose);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Delivery Details</h2>
        <form onSubmit={handleCheckout}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} 
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} 
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Delivery Address</label>
            <textarea 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', minHeight: '100px' }} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>
            Proceed to Payment (₦{total.toLocaleString()})
          </button>
        </form>
      </div>

      <div>
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Order Summary</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontWeight: '600' }}>{item.quantity}x</span> {item.name}
                </div>
                <div style={{ fontWeight: '600' }}>₦{(item.price * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>
          
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
              <span>Delivery Fee</span>
              <span>₦{deliveryFee.toLocaleString()}</span>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
