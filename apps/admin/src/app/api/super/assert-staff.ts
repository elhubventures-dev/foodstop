import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export type StaffAuthOk = { userId: string };

export async function assertStaffOrAdmin(
  req: Request,
): Promise<StaffAuthOk | NextResponse> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Missing Authorization bearer token.' }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: 'Server misconfiguration: Supabase URL/anon key missing.' },
      { status: 503 },
    );
  }
  // Attach the user's access token on every request so PostgREST sees auth.uid()
  // and RLS policies (e.g. "Users can view own profile") allow the profiles read.
  const supabase = createClient(url, anon, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (pErr || !profile) {
    return NextResponse.json({ error: 'Could not load profile.' }, { status: 403 });
  }
  const role = profile.role as string | undefined;
  if (role !== 'admin' && role !== 'staff') {
    return NextResponse.json({ error: 'Admin or staff role required.' }, { status: 403 });
  }
  return { userId: user.id };
}
