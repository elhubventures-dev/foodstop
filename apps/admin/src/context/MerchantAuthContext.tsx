'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'foodstop_merchant_session';

export type MerchantSessionMerchant = {
  id: string;
  business_name: string;
  is_verified: boolean;
  is_active: boolean;
  is_suspended: boolean;
};

export type MerchantSession = {
  access_token: string;
  merchant: MerchantSessionMerchant;
  expires_at: number;
};

type MerchantAuthContextValue = {
  session: MerchantSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  accessToken: string | null;
};

const MerchantAuthContext = createContext<MerchantAuthContextValue | null>(
  null,
);

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_CHOPFAST_API_URL ?? 'http://localhost:4000'
  ).replace(/\/$/, '');
}

function readStoredSession(): MerchantSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MerchantSession;
    if (
      !parsed?.access_token ||
      !parsed?.merchant?.id ||
      typeof parsed.expires_at !== 'number'
    ) {
      return null;
    }
    if (Date.now() > parsed.expires_at) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function MerchantAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<MerchantSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(readStoredSession());
    setLoading(false);
  }, []);

  const persist = useCallback((s: MerchantSession | null) => {
    setSession(s);
    if (typeof window === 'undefined') return;
    if (s) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${apiBase()}/api/v1/merchant/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string | string[];
      access_token?: string;
      expires_in?: number;
      merchant?: MerchantSessionMerchant;
    };
    if (!res.ok) {
      const msg = Array.isArray(data.message)
        ? data.message.join(', ')
        : typeof data.message === 'string'
          ? data.message
          : 'Login failed';
      throw new Error(msg);
    }
    if (!data.access_token || !data.merchant) {
      throw new Error('Invalid login response');
    }
    const expiresIn = Number(data.expires_in) || 86_400;
    persist({
      access_token: data.access_token,
      merchant: data.merchant,
      expires_at: Date.now() + expiresIn * 1000,
    });
  }, [persist]);

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const value = useMemo<MerchantAuthContextValue>(
    () => ({
      session,
      loading,
      login,
      logout,
      accessToken: session?.access_token ?? null,
    }),
    [session, loading, login, logout],
  );

  return (
    <MerchantAuthContext.Provider value={value}>
      {children}
    </MerchantAuthContext.Provider>
  );
}

export function useMerchantAuth(): MerchantAuthContextValue {
  const ctx = useContext(MerchantAuthContext);
  if (!ctx) {
    throw new Error('useMerchantAuth must be used under MerchantAuthProvider');
  }
  return ctx;
}
