'use client';
import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Image from 'next/image';

export default function ContactPage() {
  return (
    <div className="container" style={{ padding: '6rem 0', minHeight: '80vh' }}>
      <header className="section-header" style={{ marginBottom: '3rem', textAlign: 'center', display: 'block' }}>
        <h1 className="section-title" style={{ fontSize: 'var(--text-4xl)', marginBottom: '1.5rem' }}>Contact Us</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
          Whether you have a question about our menu, want to provide feedback, or need catering for a large event, we are here to ensure your FOOD STOP experience is flawless.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', marginTop: '4rem' }}>
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '3rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: '2.5rem', color: 'var(--color-text)' }}>Get in Touch</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--color-primary)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', color: 'white', flexShrink: 0 }}>
                <MapPin size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Our Locations</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  <strong>Abuja:</strong> 12 Wuse 2 Road, Wuse 2.<br />
                  <strong>Port Harcourt:</strong> 45 GRA Phase 2.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--color-primary)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', color: 'white', flexShrink: 0 }}>
                <Phone size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Phone</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  +234 913 344 9270
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--color-primary)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', color: 'white', flexShrink: 0 }}>
                <Mail size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Email</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  hello@foodstop.com.ng
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: 'var(--color-primary)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', color: 'white', flexShrink: 0 }}>
                <Clock size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Store Hours</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  Mon - Fri: 10:00 AM - 10:00 PM<br />
                  Sat - Sun: 11:00 AM - 9:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
           <Image 
             src="/images/brand/delivery-package.png" 
             alt="Premium Food Stop delivery packaging" 
             fill 
             style={{ objectFit: 'cover' }} 
             priority
           />
        </div>
      </div>
    </div>
  );
}
