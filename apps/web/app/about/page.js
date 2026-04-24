'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: '6rem 0', minHeight: '80vh' }}>
      <header className="section-header" style={{ marginBottom: '3rem', textAlign: 'center', display: 'block' }}>
        <h1 className="section-title" style={{ fontSize: 'var(--text-4xl)', marginBottom: '1.5rem' }}>About FOOD STOP</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
          Welcome to FOOD STOP, where we bring the authentic, unadulterated flavours of Nigeria straight to your table. From the bustling heart of Abuja to the coastal energy of Port Harcourt, we are dedicated to serving premium, freshly prepared meals that truly taste like home.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center', marginTop: '4rem' }}>
        <div style={{ 
          height: '450px', 
          backgroundColor: 'var(--color-bg-tertiary)', 
          borderRadius: 'var(--radius-xl)', 
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)'
        }}>
           <Image 
             src="/images/brand/restaurant-interior.png" 
             alt="Warm, premium Food Stop restaurant interior" 
             fill 
             style={{ objectFit: 'cover' }} 
           />
        </div>
        
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: '1.5rem', color: 'var(--color-text)' }}>Our Culinary Mission</h2>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.8', color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
            At FOOD STOP, our mission is simple yet profound: to elevate premium Nigerian cuisine, making it accessible without ever compromising on that authentic, deeply comforting home-cooked taste. We meticulously source our ingredients—from the freshest local produce to the finest traditional spices—ensuring every bite you take is a joyous celebration of our rich culinary heritage.
          </p>
          <p style={{ marginBottom: '2.5rem', lineHeight: '1.8', color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
            Whether you are craving a plate of our legendary firewood-cooked Party Jollof, the silky stretch of fresh Pounded Yam with Lumpy Egusi, or perfectly charred Spicy Suya, we have a seat at the table for you. Our master chefs bring decades of traditional experience to our modern kitchens, preparing every meal with unmistakable passion and precision.
          </p>
          <Link href="/menu" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
            Explore Our Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
