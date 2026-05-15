'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@chopfast/shared';

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname?.startsWith('/merchant')) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session) {
        // Optional: Verify role again if needed
        setIsAuthenticated(true);
        if (pathname === '/login') {
          router.push('/');
        }
      }
      setLoading(false);
    };

    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (pathname?.startsWith('/merchant')) return;
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        if (pathname === '/login') {
          router.push('/');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  // If we are on the login page, render without the admin shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (pathname?.startsWith('/merchant')) {
    return <>{children}</>;
  }

  // Otherwise, render the secure admin layout
  return isAuthenticated ? <AdminLayout>{children}</AdminLayout> : null;
};
