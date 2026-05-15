'use client';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import CartMerchantConflictModal from '@/components/cart/CartMerchantConflictModal';

const CartContext = createContext({});

const ANCHOR_MERCHANT =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_ANCHOR_MERCHANT_ID ?? '00000000-0000-0000-0000-000000000001'
    : '00000000-0000-0000-0000-000000000001';

function baseDeliveryFee(subtotal) {
  return subtotal >= 20000 ? 0 : 1500;
}

function lineMerchantId(item) {
  return item?.merchant_id || ANCHOR_MERCHANT;
}

/** @param {unknown[]} items @param {Record<string, unknown> | null} merchantPromo */
function calculateTotals(items, merchantPromo) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const tax = 0;

  if (merchantPromo && merchantPromo.valid === true) {
    return {
      subtotal,
      tax,
      deliveryFee: Number(merchantPromo.delivery_fee ?? 0),
      discount: Number(merchantPromo.discount ?? 0),
      total: Math.max(0, Number(merchantPromo.total ?? 0)),
    };
  }

  const deliveryFee = baseDeliveryFee(subtotal);
  const total = Math.max(0, subtotal + tax + deliveryFee);
  return { subtotal, tax, deliveryFee, discount: 0, total };
}

function cartMetaFromItems(items, fallbackName) {
  if (!items.length) return { merchantId: null, merchantName: null };
  const merchantId = lineMerchantId(items[0]);
  const merchantName = items[0].merchant_name || fallbackName || null;
  return { merchantId, merchantName };
}

const initialState = {
  items: [],
  subtotal: 0,
  tax: 0,
  deliveryFee: 1500,
  discount: 0,
  total: 0,
  merchantPromo: null,
  merchantId: null,
  merchantName: null,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.id === action.payload.id &&
          JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers),
      );

      let newItems;
      if (existingItemIndex >= 0) {
        newItems = [...state.items];
        const addedQty = action.payload.quantity || 1;
        newItems[existingItemIndex].quantity =
          (newItems[existingItemIndex].quantity || 0) + addedQty;
        newItems[existingItemIndex].subtotal =
          newItems[existingItemIndex].price * newItems[existingItemIndex].quantity;
      } else {
        const newItem = {
          ...action.payload,
          quantity: action.payload.quantity || 1,
          subtotal:
            action.payload.subtotal || action.payload.price * (action.payload.quantity || 1),
        };
        newItems = [...state.items, newItem];
      }

      const { merchantId, merchantName } = cartMetaFromItems(newItems, state.merchantName);

      return {
        ...state,
        items: newItems,
        merchantId,
        merchantName,
        merchantPromo: null,
        ...calculateTotals(newItems, null),
      };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((_, index) => index !== action.payload.index);
      const { merchantId, merchantName } = cartMetaFromItems(newItems, null);
      return {
        ...state,
        items: newItems,
        merchantId,
        merchantName,
        merchantPromo: null,
        ...calculateTotals(newItems, null),
      };
    }
    case 'UPDATE_QUANTITY': {
      const newItems = [...state.items];
      const item = newItems[action.payload.index];

      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { index: action.payload.index } });
      }

      item.quantity = action.payload.quantity;
      item.subtotal = item.price * item.quantity;

      const { merchantId, merchantName } = cartMetaFromItems(newItems, state.merchantName);
      return {
        ...state,
        items: newItems,
        merchantId,
        merchantName,
        merchantPromo: null,
        ...calculateTotals(newItems, null),
      };
    }
    case 'APPLY_MERCHANT_PROMO': {
      const promo = action.payload;
      return {
        ...state,
        merchantPromo: promo,
        ...calculateTotals(state.items, promo),
      };
    }
    case 'CLEAR_MERCHANT_PROMO': {
      return {
        ...state,
        merchantPromo: null,
        ...calculateTotals(state.items, null),
      };
    }
    case 'CLEAR_CART':
      return { ...initialState };
    case 'HYDRATE': {
      const validItems =
        action.payload.items?.filter(
          (item) =>
            typeof item.quantity === 'number' && !Number.isNaN(item.quantity) && item.quantity > 0,
        ) || [];
      const savedMid = action.payload.merchantId || null;
      const savedName = action.payload.merchantName || null;
      const merchantId = validItems.length
        ? savedMid || lineMerchantId(validItems[0])
        : null;
      const merchantName = validItems.length
        ? savedName || validItems[0].merchant_name || null
        : null;
      return {
        ...initialState,
        items: validItems,
        merchantId,
        merchantName,
        merchantPromo: null,
        ...calculateTotals(validItems, null),
      };
    }
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('foodstop_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (parsed.items && parsed.items.length > 0) {
          dispatch({ type: 'HYDRATE', payload: parsed });
        }
      }
    } catch (e) {
      console.error('Failed to parse cart from local storage', e);
    }
  }, []);

  useEffect(() => {
    const { merchantPromo: _p, ...persist } = state;
    localStorage.setItem('foodstop_cart', JSON.stringify(persist));
  }, [state]);

  const addItem = useCallback((item) => {
    const incomingMid = lineMerchantId(item);
    const incomingName = item.merchant_name || item.merchantName || 'This restaurant';
    const normalized = {
      ...item,
      merchant_id: incomingMid,
      merchant_name: incomingName,
    };

    const currentMid =
      state.merchantId ||
      (state.items.length > 0 ? lineMerchantId(state.items[0]) : null);

    if (state.items.length > 0 && currentMid && incomingMid !== currentMid) {
      setConflict({
        currentName: state.merchantName || 'your current restaurant',
        incomingName: incomingName,
        payload: normalized,
      });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: normalized });
    toast.success(`${item.name} added to cart!`);
    setIsDrawerOpen(true);
  }, [state.items, state.merchantId, state.merchantName]);

  const confirmReplaceCart = useCallback(() => {
    if (!conflict?.payload) return;
    const payload = conflict.payload;
    dispatch({ type: 'CLEAR_CART' });
    dispatch({ type: 'ADD_ITEM', payload });
    setConflict(null);
    toast.success(`${payload.name} added — previous cart cleared`);
    setIsDrawerOpen(true);
  }, [conflict]);

  const dismissCartConflict = useCallback(() => {
    setConflict(null);
  }, []);

  const removeItem = (index) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { index } });
  };

  const updateQuantity = (index, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const clearMerchantPromo = () => {
    dispatch({ type: 'CLEAR_MERCHANT_PROMO' });
  };

  const applyMerchantPromo = async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) {
      toast.error('Enter a promo code');
      return false;
    }
    if (!state.items.length) {
      toast.error('Cart is empty');
      return false;
    }

    const merchantId = state.merchantId || lineMerchantId(state.items[0]);
    const subtotal = state.items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
    const delivery_fee = baseDeliveryFee(subtotal);

    try {
      const res = await fetch('/api/checkout/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          code: trimmed,
          subtotal,
          delivery_fee,
        }),
      });
      const data = await res.json();
      if (!data?.valid) {
        const msg =
          data?.reason === 'min_order'
            ? `Minimum order ₦${Number(data.min_order || 0).toLocaleString()} for this code.`
            : 'Invalid or expired promo code.';
        toast.error(msg);
        return false;
      }
      dispatch({
        type: 'APPLY_MERCHANT_PROMO',
        payload: { valid: true, ...data },
      });
      toast.success(`Code ${String(data.code || trimmed).toUpperCase()} applied`);
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Could not validate promo code');
      return false;
    }
  };

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cart: state,
    itemCount,
    isDrawerOpen,
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
    addItem,
    toggleCart: () => setIsDrawerOpen((prev) => !prev),
    removeItem,
    updateQuantity,
    clearCart,
    applyMerchantPromo,
    clearMerchantPromo,
    applyCoupon: applyMerchantPromo,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartMerchantConflictModal
        open={Boolean(conflict)}
        currentName={conflict?.currentName}
        incomingName={conflict?.incomingName}
        onKeep={dismissCartConflict}
        onReplace={confirmReplaceCart}
      />
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
