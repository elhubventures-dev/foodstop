'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Store, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import './MobileNav.css';

export default function MobileNav() {
  const pathname = usePathname();
  const { toggleCart, itemCount } = useCart();
  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/restaurants', label: 'Explore', icon: Store },
    { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/account', label: 'Account', icon: User },
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        <button 
          className="mobile-nav-item cart-trigger" 
          onClick={toggleCart}
        >
          <div className="cart-icon-wrapper">
            <ShoppingBag size={22} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </div>
          <span>Cart</span>
        </button>
      </div>
    </nav>
  );
}
