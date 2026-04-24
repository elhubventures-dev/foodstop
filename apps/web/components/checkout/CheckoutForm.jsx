'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePaystackPayment } from 'react-paystack';
import toast from 'react-hot-toast';

import './CheckoutForm.css';

export default function CheckoutForm() {
  const { cart, clearCart } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync profile data when available
  useEffect(() => {
    if (profile?.phone && !phoneNumber) {
      setPhoneNumber(profile.phone);
    }
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [email, phoneNumber, profile, user?.email]);

  // Prevent hydration mismatch for cart amounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert total to Kobo for Paystack (NGN * 100)
  const amountInKobo = Math.round((cart?.total || 0) * 100);

  const config = {
    reference: `FS-${(new Date()).getTime().toString()}`,
    email: email || user?.email || 'guest@foodstop.com.ng',
    amount: amountInKobo,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference) => {
    toast.success('Payment successful!');
    
    try {
       const res = await fetch('/api/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           ...cart,
           address,
           phoneNumber,
           email: email || user?.email,
           userId: user?.id,
           paystackReference: reference.reference
         })
       });
       
       if (!res.ok) throw new Error('Order creation failed on server');
       
       const data = await res.json();
       clearCart();
       router.push(`/order-confirmation?id=${data.orderId}`);
    } catch(err) {
       console.error(err);
       toast.error('Payment succeeded but order creation failed. Please contact support.');
    } finally {
       setLoading(false);
    }
  };

  const onClose = () => {
    setLoading(false);
    toast.error('Payment window closed. Order not completed.');
  };

  const proceedToPayment = () => {
    if (!address || !phoneNumber || (!user && !email)) {
      toast.error('Please enter delivery address, phone number, and email.');
      return;
    }
    setStep(2);
  };

  const handleCheckout = () => {
    setLoading(true);
    initializePayment(onSuccess, onClose);
  };

  if (!mounted) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading checkout...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p style={{ margin: '1rem 0' }}>Looks like you haven&apos;t selected anything yet.</p>
        <Link href="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {/* Left Column: Form Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Step 1: Details */}
        <div className={`checkout-card ${step === 1 ? 'active' : ''}`}>
          <h2>1. Delivery Details</h2>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!user && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p>Have an account? <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Log in for faster checkout</Link></p>
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">Full Delivery Address</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="E.g. 12 Adetokunbo Ademola Crescent, Wuse 2"
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+234 90..."
                  className="form-input"
                />
              </div>
              {!user && (
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="form-input"
                  />
                </div>
              )}
              <button 
                className="btn btn-primary" 
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                onClick={proceedToPayment}
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>Address:</strong> {address}</p>
              <p style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> {phoneNumber}</p>
              <p><strong>Email:</strong> {email || user?.email}</p>
              <button 
                onClick={() => setStep(1)} 
                style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '1rem', fontWeight: '600', padding: 0 }}
              >
                Edit Details
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Payment */}
        <div className={`checkout-card ${step === 2 ? 'active' : 'disabled'}`}>
          <h2>2. Payment</h2>
          {step === 2 && (
            <div>
              <div className="payment-info-box">
                You will be securely redirected to Paystack to complete your payment using Card, Bank Transfer, or USSD.
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleCheckout} 
                disabled={loading}
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              >
                {loading ? 'Processing...' : `Pay ₦${Number(cart.total).toLocaleString()} Safely`}
              </button>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Right Column: Order Summary */}
      <div>
        <div className="checkout-card order-summary-card">
          <h2>Order Summary</h2>
          <ul className="summary-list">
            {cart.items.map((item, i) => (
              <li key={i} className="summary-item">
                <div className="summary-item-info">
                  <span className="summary-item-name">{item.quantity}x {item.name}</span>
                  {item.modifiers && Object.values(item.modifiers).length > 0 && (
                     <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                       {Object.values(item.modifiers).join(', ')}
                     </span>
                  )}
                </div>
                <span className="summary-item-price">₦{Number(item.subtotal).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          
          <div className="totals-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>Subtotal</span>
              <span>₦{Number(cart.subtotal).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>Delivery</span>
              <span>{cart.deliveryFee === 0 ? 'Free' : `₦${Number(cart.deliveryFee).toLocaleString()}`}</span>
            </div>
            {cart.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                <span>Discount</span>
                <span>-₦{Number(cart.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="total-row">
              <span>Total</span>
              <span>₦{Number(cart.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

