// app/auth/login/page.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import '../auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      router.push('/account');
      router.refresh();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to your FOOD STOP account</p>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
            />
          </div>
          
          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
              <Link href="/auth/reset" className="auth-link small">Forgot password?</Link>
            </div>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <p className="auth-footer">
          Don&apos;t have an account? <Link href="/auth/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
