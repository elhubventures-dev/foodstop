'use client';
import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext({});

// Calculate totals helper
const calculateTotals = (items, discountValue = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = 0; // Removing hidden tax as prices are expected to be inclusive
  let discount = 0;
  
  if (discountValue > 0) {
    // Assuming discountValue is a fixed amount for simplicity, 
    // real app would handle percentage vs fixed
    discount = discountValue; 
  }
  
  // Base delivery fee 1500 NGN, free if over 20000 NGN
  const deliveryFee = subtotal >= 20000 ? 0 : 1500;
  
  const total = subtotal + tax + deliveryFee - discount;
  
  return { subtotal, tax, deliveryFee, discount, total: Math.max(0, total) };
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id && 
                  JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers)
      );

      let newItems;
      if (existingItemIndex >= 0) {
        newItems = [...state.items];
        const addedQty = action.payload.quantity || 1;
        newItems[existingItemIndex].quantity = (newItems[existingItemIndex].quantity || 0) + addedQty;
        newItems[existingItemIndex].subtotal = newItems[existingItemIndex].price * newItems[existingItemIndex].quantity;
      } else {
        const newItem = {
          ...action.payload,
          quantity: action.payload.quantity || 1,
          subtotal: action.payload.subtotal || (action.payload.price * (action.payload.quantity || 1))
        };
        newItems = [...state.items, newItem];
      }
      
      return { 
        ...state, 
        items: newItems,
        ...calculateTotals(newItems, state.discount)
      };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((_, index) => index !== action.payload.index);
      return { 
        ...state, 
        items: newItems,
        ...calculateTotals(newItems, state.discount)
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
      
      return { 
        ...state, 
        items: newItems,
        ...calculateTotals(newItems, state.discount)
      };
    }
    case 'APPLY_DISCOUNT': {
      return {
        ...state,
        discount: action.payload,
        ...calculateTotals(state.items, action.payload)
      };
    }
    case 'CLEAR_CART':
      return {
        items: [],
        subtotal: 0,
        tax: 0,
        deliveryFee: 1500,
        discount: 0,
        total: 0,
      };
    case 'HYDRATE': {
      // Clean up potentially corrupted items loaded from localStorage (e.g. NaN quantity)
      const validItems = action.payload.items?.filter(item => typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) || [];
      return { 
        ...action.payload, 
        items: validItems, 
        ...calculateTotals(validItems, action.payload.discount) 
      };
    }
    default:
      return state;
  }
};

const initialState = {
  items: [],
  subtotal: 0,
  tax: 0,
  deliveryFee: 1500,
  discount: 0,
  total: 0,
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load from localStorage on mount
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

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('foodstop_cart', JSON.stringify(state));
  }, [state]);

  const addItem = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    toast.success(`${item.name} added to cart!`);
    setIsDrawerOpen(true);
  };

  const removeItem = (index) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { index } });
  };

  const updateQuantity = (index, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const applyCoupon = async (code) => {
    // Mock coupon validation
    if (code.toUpperCase() === 'WELCOME10') {
      dispatch({ type: 'APPLY_DISCOUNT', payload: 1000 }); // fixed 1000 NGN discount
      toast.success('Coupon applied!');
      return true;
    }
    toast.error('Invalid or expired coupon');
    return false;
  };

  // Provide the total item count
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cart: state,
    itemCount,
    isDrawerOpen,
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
    addItem,
    toggleCart: () => setIsDrawerOpen(prev => !prev),
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
