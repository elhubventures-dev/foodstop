'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MapPin, Clock, Phone, ReceiptText, ChevronRight, Star, Bike } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fmtNgn(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || '';
  const [summary, setSummary] = useState(null);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    if (!orderId || !UUID_RE.test(orderId)) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/order-summary?id=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadErr(data.error || 'Could not load order');
          setSummary(null);
          return;
        }
        setLoadErr(null);
        setSummary(data);
      } catch {
        if (!cancelled) setLoadErr('Network error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const steps = [
    { label: 'Confirmed', status: 'completed', icon: CheckCircle },
    { label: 'Preparing', status: 'current', icon: Clock },
    { label: 'Out for Delivery', status: 'upcoming', icon: MapPin },
  ];

  const merchant = summary?.merchant;
  const items = summary?.items || [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {merchant?.logo_url && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={merchant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>Your order from</p>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              {merchant.business_name}
            </h2>
            {merchant.slug && (
              <Link href={`/restaurants/${merchant.slug}`} style={{ fontSize: '0.85rem' }}>
                View store
              </Link>
            )}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1a1a1a' }}>
          Order confirmed
        </h1>
        <p style={{ color: '#666', fontSize: '1.05rem' }}>
          {summary ? (
            <>
              Order <strong>{summary.id.slice(0, 8)}</strong> · {summary.status}
            </>
          ) : orderId ? (
            <>Order reference: {orderId.slice(0, 8)}…</>
          ) : (
            <>Thanks — your kitchen has been notified.</>
          )}
        </p>
        {loadErr && (
          <p style={{ color: '#b45309', fontSize: '0.9rem', marginTop: '0.75rem' }}>{loadErr}</p>
        )}
      </div>

      <div className="order-confirm-ratings card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>After delivery</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          Rate the restaurant and the rider separately once your order is complete.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link
            href="/account/orders#rate-restaurant"
            className="btn btn-secondary-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Star size={16} /> Rate restaurant
          </Link>
          <Link
            href="/account/orders#rate-rider"
            className="btn btn-secondary-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Bike size={16} /> Rate rider
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', textAlign: 'left' }}>
        <div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Delivery status</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor:
                        step.status === 'completed'
                          ? '#10b981'
                          : step.status === 'current'
                            ? 'var(--color-primary)'
                            : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem',
                      color: 'white',
                    }}
                  >
                    <step.icon size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: step.status === 'upcoming' ? '#9ca3af' : '#1a1a1a',
                    }}
                  >
                    {step.label}
                  </span>
                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '50%',
                        width: '100%',
                        height: '2px',
                        backgroundColor: step.status === 'completed' ? '#10b981' : '#e5e7eb',
                        zIndex: -1,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Delivery details</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--color-primary)' }}>
                <MapPin size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Address on file</p>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>Shown in your order email confirmation.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ color: 'var(--color-primary)' }}>
                <Phone size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Support</p>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>Contact us if anything looks wrong.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <ReceiptText size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Order summary</h3>
            </div>
            <div style={{ borderBottom: '1px dashed #ddd', paddingBottom: '1rem', marginBottom: '1rem' }}>
              {items.length > 0 ? (
                items.map((line, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}
                  >
                    <span>
                      {line.quantity}× {line.name}
                    </span>
                    <span style={{ fontWeight: 600 }}>{fmtNgn(line.subtotal)}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Line items appear here when loaded.</p>
              )}
            </div>
            {summary && (
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span>Subtotal</span>
                  <span>{fmtNgn(summary.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span>Delivery</span>
                  <span>{fmtNgn(summary.delivery_fee)}</span>
                </div>
                {Number(summary.discount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#16a34a' }}>
                    <span>Promo</span>
                    <span>-{fmtNgn(summary.discount)}</span>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              <span>Total</span>
              <span>{summary ? fmtNgn(summary.total) : '—'}</span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href={merchant?.slug ? `/restaurants/${merchant.slug}` : '/restaurants'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
            >
              Order again <ChevronRight size={18} />
            </Link>
            <Link href="/restaurants" style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
              Explore more restaurants
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
