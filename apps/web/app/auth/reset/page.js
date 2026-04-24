// app/auth/reset/page.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import '../auth.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/update-password` 
      : '';
      
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success('Password reset link sent!');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        
        {success ? (
          <div className="text-center">
            <p className="auth-subtitle text-success mb-6">
              Check your email for a link to reset your password. If it doesn&apos;t appear within a few minutes, check your spam folder.
            </p>
            <Link href="/auth/login" className="btn btn-secondary auth-btn">
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="auth-subtitle">Enter your email and we&apos;ll send you a link to reset your password.</p>
            <form onSubmit={handleReset} className="auth-form">
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
              
              <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        
        <p className="auth-footer">
          Remember your password? <Link href="/auth/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
