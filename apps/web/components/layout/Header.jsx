'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, User, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import './Header.css';

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleCart, itemCount } = useCart();
  const cartCount = itemCount;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname.startsWith('/admin')) return null;

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link href="/" className="logo" onClick={closeMobileMenu}>
          <span className="logo-text">FOOD STOP</span>
          <span className="logo-subtext">RESTAURANT</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link href="/menu" className="nav-link">Menu</Link>
          <Link href="/contact" className="nav-link">Locations</Link>
          <Link href="/story" className="nav-link">Our Story</Link>
          <div className="delivery-info">
            <MapPin size={16} />
            <span>Abuja & Port Harcourt</span>
          </div>
        </nav>

        {/* Utilities */}
        <div className="header-utils">
          <Link href="/account" className="icon-button" aria-label="Account">
            <User size={22} />
          </Link>
          <button 
            className="cart-button" 
            aria-label="Shopping Cart"
            onClick={toggleCart}
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
           <nav className="mobile-nav">
              <Link href="/menu" className="mobile-nav-link" onClick={closeMobileMenu}>Full Menu</Link>
              <Link href="/contact" className="mobile-nav-link" onClick={closeMobileMenu}>Our Locations</Link>
              <Link href="/story" className="mobile-nav-link" onClick={closeMobileMenu}>The Story</Link>
              <Link href="/account" className="mobile-nav-link" onClick={closeMobileMenu}>My Account</Link>
           </nav>
        </div>
      </div>
    </header>
  );
}
