'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    console.log('🔐 Attempting admin login for:', email);
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        toast.error('Authentication failed: No user data returned.');
        setLoading(false);
        return;
      }

      // Check for admin role specifically
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        toast.error('Error verifying permissions. Please try again.');
        setLoading(false);
        return;
      }

      if (profile?.role === 'admin' || profile?.role === 'staff') {
        toast.success(`Access Granted: ${profile.role.toUpperCase()}`);
        router.push('/admin');
      } else {
        toast.error('Access Denied: You do not have administrator permissions.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      toast.error('An unexpected error occurred. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#0f172a', /* Dark slate background */
      backgroundImage: 'radial-gradient(circle at top right, #1e293b, transparent), radial-gradient(circle at bottom left, #1e293b, transparent)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '2.5rem', 
        backgroundColor: 'rgba(30, 41, 59, 0.7)', 
        backdropFilter: 'blur(12px)',
        borderRadius: '1.5rem', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1rem', 
            backgroundColor: 'rgba(56, 189, 248, 0.1)', 
            borderRadius: '1rem', 
            marginBottom: '1rem',
            color: '#38bdf8' 
          }}>
            <ShieldCheck size={40} />
          </div>
          <h1 style={{ color: 'white', fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Management Portal</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem' }}>Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.875rem 1rem 0.875rem 3rem', 
                  backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '0.75rem', 
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }}
                placeholder="admin@foodstop.com"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Access Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.875rem 1rem 0.875rem 3rem', 
                  backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '0.75rem', 
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '1rem',
              padding: '1rem', 
              backgroundColor: '#0ea5e9', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.75rem', 
              fontSize: '1rem', 
              fontWeight: 600, 
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enter Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none' }}>
            &larr; Return to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
}
