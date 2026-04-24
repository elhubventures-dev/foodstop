'use client';
import { useRouter } from 'next/navigation';
import { Construction, ArrowLeft } from 'lucide-react';

export default function UnderConstruction() {
  const router = useRouter();

  return (
    <div className="container" style={{ 
      padding: '8rem 2rem', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <div style={{ 
        backgroundColor: 'rgba(234, 179, 8, 0.1)', 
        color: 'var(--color-primary)', 
        padding: '2rem', 
        borderRadius: '50%', 
        marginBottom: '2rem' 
      }}>
        <Construction size={64} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '1rem' }}>Coming Soon</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', maxWidth: '500px', marginBottom: '2.5rem' }}>
        We are currently building this feature to give you the best experience. Check back soon for updates!
      </p>
      <button 
        onClick={() => router.back()} 
        className="btn btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={20} /> Go Back
      </button>
    </div>
  );
}
