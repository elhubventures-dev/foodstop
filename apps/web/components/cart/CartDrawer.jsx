'use client';
import { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const {
    cart,
    itemCount,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    applyMerchantPromo,
    clearMerchantPromo,
  } = useCart();
  const [promoInput, setPromoInput] = useState('');

  if (!isDrawerOpen) return null;

  return (
    <>
      <div className="cart-backdrop" onClick={closeDrawer} />
      
      <div className={`cart-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Order ({itemCount})</h2>
          <button className="cart-close" onClick={closeDrawer} aria-label="Close cart">
            <X size={24} />
          </button>
        </div>

        <div className="cart-body">
          {cart.items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} className="empty-icon" />
              <h3>Your cart is empty</h3>
              <p>Looks like you haven&apos;t added any delicious Nigerian dishes yet.</p>
              <button className="btn btn-primary" onClick={closeDrawer}>
                Browse Menu
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cart.items.map((item, index) => (
                <li key={`${item.id}-${index}`} className="cart-item">
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    {item.modifiers && Object.values(item.modifiers).length > 0 && (
                      <p className="item-modifiers">
                        {Object.values(item.modifiers).join(', ')}
                      </p>
                    )}
                    <div className="item-price">₦{item.price.toLocaleString()}</div>
                  </div>
                  
                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.items.length > 0 && cart.merchantName && (
          <div style={{ padding: '0 1.25rem 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Ordering from <strong style={{ color: 'var(--color-text-primary)' }}>{cart.merchantName}</strong>
          </div>
        )}

        {cart.items.length > 0 && (
          <div className="cart-promo" style={{ padding: '0 1.25rem 0.75rem' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code"
                className="form-input"
                style={{
                  flex: 1,
                  padding: '0.5rem 0.65rem',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                }}
              />
              <button
                type="button"
                className="btn"
                style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}
                onClick={() => void applyMerchantPromo(promoInput)}
              >
                Apply
              </button>
            </div>
            {cart.merchantPromo?.valid && (
              <button
                type="button"
                onClick={() => {
                  clearMerchantPromo();
                  setPromoInput('');
                }}
                style={{
                  marginTop: 6,
                  fontSize: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Remove {String(cart.merchantPromo.code || '').toUpperCase()}
              </button>
            )}
          </div>
        )}

        {cart.items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₦{cart.subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>{cart.deliveryFee === 0 ? 'Free' : `₦${cart.deliveryFee.toLocaleString()}`}</span>
              </div>
              {cart.discount > 0 && (
                <div className="summary-row text-success">
                  <span>Promo</span>
                  <span>-₦{cart.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Estimated Total</span>
                <span>₦{cart.total.toLocaleString()}</span>
              </div>
            </div>
            
            <Link 
              href="/checkout" 
              className="btn btn-primary checkout-btn"
              onClick={closeDrawer}
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
