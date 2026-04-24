'use client';
import dynamic from 'next/dynamic';

const CheckoutContent = dynamic(() => import('@/components/checkout/CheckoutForm'), {
  ssr: false,
  loading: () => <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading checkout...</div>
});

export default function CheckoutPage() {
  return (
    <div className="container" style={{ padding: '3rem 0', minHeight: '80vh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '2rem' }}>Checkout</h1>
      <CheckoutContent />
    </div>
  );
}
