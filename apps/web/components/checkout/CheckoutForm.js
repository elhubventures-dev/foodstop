import React, { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function CheckoutForm() {
  const router = useRouter();
  const { cart, clearCart, applyMerchantPromo, clearMerchantPromo } = useCart();
  const [promoInput, setPromoInput] = useState('');
  const { user, profile } = useAuth();
  
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill user data if available
  useEffect(() => {
    if (user) setEmail(user.email || '');
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [user, profile]);
  
  const subtotal = cart.subtotal || 0;
  const deliveryFee = cart.deliveryFee || 0;
  const total = cart.total || 0;

  const config = {
    reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email: email,
    amount: Math.round(total * 100), // Paystack expects amount in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(config);

  const createOrder = async (paystackReference) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items,
          subtotal,
          deliveryFee,
          tax: cart.tax || 0,
          discount: cart.discount || 0,
          total,
          address,
          phoneNumber: phone,
          email,
          userId: user?.id,
          paystackReference,
          promoCode: cart.merchantPromo?.valid ? cart.merchantPromo.code : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const result = await response.json();
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/order-confirmation?id=${result.orderId}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Something went wrong while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSuccess = (reference) => {
    console.log('Payment successful. Reference:', reference);
    createOrder(reference.reference);
  };

  const onClose = () => {
    toast('Payment cancelled', { icon: 'ℹ️' });
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!email || !address || !name || !phone) {
      toast.error('Please fill out all delivery details');
      return;
    }
    
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
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
              placeholder="Your full name"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} 
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} 
                placeholder="+234..."
              />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Delivery Address</label>
            <textarea 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', minHeight: '100px' }} 
              placeholder="Enter your full delivery address"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Promo code (optional)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                placeholder="Enter code"
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0 1rem' }}
                onClick={() => void applyMerchantPromo(promoInput)}
              >
                Apply
              </button>
            </div>
            {cart.merchantPromo?.valid && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 8 }}>
                Applied: <strong>{String(cart.merchantPromo.code || '').toUpperCase()}</strong>{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearMerchantPromo();
                    setPromoInput('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Remove
                </button>
              </p>
            )}
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', opacity: isSubmitting ? 0.7 : 1 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : `Proceed to Payment (₦${total.toLocaleString()})`}
          </button>
        </form>
      </div>

      <div>
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Order Summary</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {cart.items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <span style={{ fontWeight: '600' }}>{item.quantity}x</span> {item.name}
                  {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {Object.values(item.modifiers).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: '600' }}>₦{item.subtotal.toLocaleString()}</div>
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
              <span>{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
            </div>
            {cart.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a' }}>
                <span>Promo</span>
                <span>-₦{cart.discount.toLocaleString()}</span>
              </div>
            )}
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
