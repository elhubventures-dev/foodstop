'use client';

import './CartMerchantConflictModal.css';

export default function CartMerchantConflictModal({
  open,
  currentName,
  incomingName,
  onKeep,
  onReplace,
}) {
  if (!open) return null;

  return (
    <div
      className="cart-conflict-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-conflict-title"
    >
      <div className="cart-conflict-modal">
        <h2 id="cart-conflict-title" className="cart-conflict-title">
          Start a new order?
        </h2>
        <p className="cart-conflict-body">
          Your cart has items from <strong>{currentName}</strong>. Adding from{' '}
          <strong>{incomingName}</strong> will clear your current cart.
        </p>
        <div className="cart-conflict-actions">
          <button type="button" className="btn btn-secondary-outline" onClick={onKeep}>
            Keep current cart
          </button>
          <button type="button" className="btn btn-primary" onClick={onReplace}>
            Start new order
          </button>
        </div>
      </div>
    </div>
  );
}
