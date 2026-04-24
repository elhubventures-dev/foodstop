import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      padding: '4rem 0'
    }}>
      <AlertTriangle size={64} color="var(--color-primary)" style={{ marginBottom: '1.5rem' }} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', marginBottom: '2rem' }}>
        Oops! The page or dish you&apos;re looking for doesn&apos;t seem to exist. It might have been moved or is no longer available.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/" className="btn btn-secondary">
          Go Home
        </Link>
        <Link href="/menu" className="btn btn-primary">
          View Menu
        </Link>
      </div>
    </div>
  );
}
