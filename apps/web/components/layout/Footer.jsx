'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">FOOD STOP</Link>
            <p className="footer-description">
              Authentic Nigerian cuisine delivered fresh and hot. Experience the true taste of home with our carefully prepared dishes.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
              <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
            </div>
          </div>

          <div className="footer-links">
            <h3 className="footer-heading">Quick Links</h3>
            <ul>
              <li><Link href="/menu">Full Menu</Link></li>
              <li><Link href="/contact">Locations</Link></li>
              <li><Link href="/story">Our Story</Link></li>
              <li><Link href="/account/orders">Track Order</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3 className="footer-heading">Support</h3>
            <ul>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/story">Story</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-contact">
            <h3 className="footer-heading">Contact Us</h3>
            <ul className="contact-list">
              <li>
                <MapPin size={18} />
                <span>
                  <strong>Abuja:</strong> 12 Wuse 2 Road<br />
                  <strong>Port Harcourt:</strong> 45 GRA Phase 2
                </span>
              </li>
              <li>
                <Phone size={18} />
                <span><a href="tel:+2349133449270">+2349133449270</a></span>
              </li>
              <li>
                <Mail size={18} />
                <span><a href="mailto:hello@foodstop.com.ng">hello@foodstop.com.ng</a></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FOOD STOP Restaurant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
