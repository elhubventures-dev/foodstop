import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { safeRedirectPath } from './lib/safeRedirect.js';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith('/account') && !user) {
    const login = new URL('/auth/login', request.url);
    const next = safeRedirectPath(path);
    if (next) login.searchParams.set('redirect', next);
    return NextResponse.redirect(login);
  }

  if (path.startsWith('/admin')) {
    if (path === '/admin/login') return supabaseResponse;
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/account', '/account/:path*', '/admin/:path*', '/checkout/:path*'],
};
