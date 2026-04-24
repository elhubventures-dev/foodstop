# Phase 4 — Cart & Checkout

## Cart Context (`context/CartContext.js`)

Manages cart state globally with `useReducer` for predictable state transitions.

### State Shape
```js
const initialState = {
  items: [],        // Array of cart item objects
  isOpen: false,    // Cart drawer visibility
};
```

### Cart Item Shape
```js
{
  id: 'unique-cart-id',          // Generated UUID for this cart entry
  menuItemId: 'menu-item-uuid',
  name: 'Margherita Pizza',
  price: 12.99,                  // Base price
  image: '/images/menu/pizza.webp',
  quantity: 2,
  modifiers: [
    { groupName: 'Size', name: 'Large', priceAdjustment: 3.00 },
    { groupName: 'Toppings', name: 'Extra Cheese', priceAdjustment: 1.50 },
  ],
  specialInstructions: 'No onions please',
  itemTotal: 34.98,              // (price + modifier adjustments) * quantity
}
```

### Reducer Actions
```js
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Check if identical item exists (same menuItemId + same modifiers)
      const existingIndex = state.items.findIndex(item =>
        item.menuItemId === action.payload.menuItemId &&
        JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers)
      );
      if (existingIndex >= 0) {
        // Increment quantity of existing item
        const updated = [...state.items];
        updated[existingIndex].quantity += action.payload.quantity;
        updated[existingIndex].itemTotal = calculateItemTotal(updated[existingIndex]);
        return { ...state, items: updated };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity, itemTotal: calculateItemTotal({ ...item, quantity: action.payload.quantity }) }
            : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };
    default:
      return state;
  }
}
```

### Persistence
- Save cart to `localStorage` on every change
- On mount, hydrate from `localStorage`
- For logged-in users, optionally sync to a `cart_items` database table
- Handle hydration mismatch by wrapping in `useEffect`

```js
useEffect(() => {
  const saved = localStorage.getItem('cart');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.items.forEach(item => dispatch({ type: 'ADD_ITEM', payload: item }));
    } catch (e) { /* ignore corrupted data */ }
  }
}, []);

useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(state));
}, [state]);
```

### Context Provider Value
```js
const value = {
  items: state.items,
  isOpen: state.isOpen,
  addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
  removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
  updateQuantity: (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
  clearCart: () => dispatch({ type: 'CLEAR_CART' }),
  toggleCart: () => dispatch({ type: 'TOGGLE_CART' }),
  setCartOpen: (open) => dispatch({ type: 'SET_CART_OPEN', payload: open }),
  itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
  subtotal: state.items.reduce((sum, item) => sum + item.itemTotal, 0),
};
```

## Cart Drawer (`components/cart/CartDrawer.js`)

Slide-in panel from the right side of the screen.

### Features
- Backdrop overlay with click-to-close
- Smooth slide animation (`slideInRight`)
- Header with item count and close button
- Scrollable item list
- Each item shows: image thumbnail, name, modifiers, quantity controls (+/-), price, remove button
- Summary section at bottom: subtotal, delivery estimate, total
- "Checkout" CTA button (primary, full-width)
- "Continue Shopping" link
- Empty cart state with illustration and "Browse Menu" CTA
- Trap focus within drawer when open (accessibility)
- Close on Escape key

### CSS
```css
.cart-drawer-overlay {
  position: fixed;
  inset: 0;
  background: hsla(0, 0%, 0%, 0.5);
  z-index: var(--z-modal-backdrop);
  animation: fadeIn var(--transition-fast);
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 90vw);
  background: var(--color-surface);
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  animation: slideInRight var(--transition-base);
  box-shadow: -4px 0 20px hsla(0, 0%, 0%, 0.15);
}

.cart-drawer__header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-drawer__items {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-6);
}

.cart-drawer__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}
```

## Cart Item Component (`components/cart/CartItem.js`)

Each item row displays:
- Small thumbnail image (64x64)
- Item name and selected modifiers (muted text)
- Quantity controls: minus button, count, plus button
- Line item price
- Remove button (trash icon, requires confirmation or swipe-to-delete on mobile)
- Special instructions (collapsible/truncated)

## Quantity Selector

Reusable component used in cart and item detail:
```css
.quantity-selector {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.quantity-selector__btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.quantity-selector__btn:hover {
  background: var(--color-bg-secondary);
}

.quantity-selector__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quantity-selector__count {
  width: 40px;
  text-align: center;
  font-weight: 600;
}
```

## Checkout Flow (`app/checkout/page.js`)

Multi-step form with progress indicator.

### Steps
1. **Order Type** — Delivery or Pickup toggle
2. **Delivery Address** — Select saved address or enter new one (only for delivery)
3. **Payment** — Paystack Popup or redirect to Paystack Checkout
4. **Review & Confirm** — Order summary with all details

### Step Indicator
```css
.checkout-steps {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.checkout-step {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.checkout-step__circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: 600;
  border: 2px solid var(--color-border);
  color: var(--color-text-muted);
  transition: all var(--transition-base);
}

.checkout-step--active .checkout-step__circle {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.checkout-step--completed .checkout-step__circle {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.checkout-step__line {
  width: 40px;
  height: 2px;
  background: var(--color-border);
}

.checkout-step--completed + .checkout-step__line {
  background: var(--color-success);
}
```

### Address Form
- Street, City, State, Postal Code, Country
- Delivery instructions textarea
- Save to address book checkbox (for logged-in users)
- Google Places Autocomplete (optional enhancement)
- Validation: all fields required, postal code format check

### Order Summary Sidebar
Visible on desktop (right column), collapsible on mobile:
- Item list with quantities and modifiers
- Subtotal
- Delivery fee (show "FREE" in green if over threshold)
- Tax calculation 
- Coupon/promo code input with "Apply" button
- Discount amount (if coupon applied)
- **Order total** (bold, large)

### Coupon System
```js
const applyCoupon = async (code) => {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) return { error: 'Invalid coupon code' };

  const now = new Date();
  if (coupon.valid_until && new Date(coupon.valid_until) < now)
    return { error: 'Coupon has expired' };
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
    return { error: 'Coupon usage limit reached' };
  if (subtotal < coupon.min_order_amount)
    return { error: `Minimum order of $${coupon.min_order_amount} required` };

  let discount;
  if (coupon.discount_type === 'percentage') {
    discount = subtotal * (coupon.discount_value / 100);
    if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  } else {
    discount = coupon.discount_value;
  }

  return { coupon, discount };
};
```

### Price Calculations
```js
const calculateOrderTotals = (items, deliveryType, couponDiscount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  
  // Delivery fee from store settings
  const deliveryFee = deliveryType === 'delivery'
    ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : BASE_DELIVERY_FEE)
    : 0;

  const taxableAmount = subtotal - couponDiscount;
  const tax = Math.max(0, taxableAmount * TAX_RATE);
  const total = subtotal + deliveryFee + tax - couponDiscount;

  return { subtotal, deliveryFee, tax, discount: couponDiscount, total };
};
```
