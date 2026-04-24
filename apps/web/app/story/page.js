'use client';
import React from 'react';
import Link from 'next/link';

export default function StoryPage() {
  return (
    <div className="container" style={{ padding: '6rem 0', minHeight: '80vh' }}>
      <header className="section-header" style={{ marginBottom: '4rem', textAlign: 'center', display: 'block' }}>
        <h1 className="section-title" style={{ fontSize: 'var(--text-4xl)', marginBottom: '1.5rem' }}>The Food Stop Story</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', maxWidth: '800px', margin: '0 auto' }}>
          A journey of passion, tradition, and the pursuit of the perfect Nigerian meal.
        </p>
      </header>

      <article style={{ maxWidth: '800px', margin: '0 auto', fontSize: 'var(--text-lg)', lineHeight: '1.8', color: 'var(--color-text-primary)' }}>
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>From Humble Beginnings</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            FOOD STOP was born out of a simple desire: to bring the authentic, rich flavors of home to the fast-paced modern world. We noticed that while everyone loves a great Nigerian meal, it was often hard to find premium, high-quality dishes that were consistent, clean, and delivered hot.
          </p>
          <p>
            In 2024, our founders decided to bridge that gap. Starting with a single kitchen, we focused on mastering the recipes passed down through generations while implementing modern standards of quality and service.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>The Secret Ingredient</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            What makes FOOD STOP different? It&apos;s not just the spices or the technique—it&apos;s the heart. We believe that food is more than just fuel; it&apos;s a way to connect with our heritage and share warmth with others.
          </p>
          <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', margin: '2rem 0', backgroundImage: "url('/images/brand/hero-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <p>
            Every pot of soup we simmer, every grain of rice we steam, and every piece of protein we grill is handled with the utmost care. We use only the freshest locally sourced ingredients to ensure that every meal we serve is a testament to the vibrancy of Nigerian culture.
          </p>
        </section>

        <section style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: '2rem' }}>Be Part of Our Journey</h2>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link href="/menu" className="btn btn-primary">
              Order Your Favorites
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Find Our Locations
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
