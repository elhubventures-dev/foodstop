import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../assert-staff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type Body = { suspend_below?: number; min_reviews?: number; sustain_days?: number };

export async function POST(req: Request) {
  const auth = await assertStaffOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Set SUPABASE_SERVICE_ROLE_KEY to run rating enforcement.' },
      { status: 503 },
    );
  }

  let body: Body = {};
  try {
    if (req.headers.get('content-length') !== '0') {
      body = (await req.json()) as Body;
    }
  } catch {
    body = {};
  }

  const { data, error } = await admin.rpc('run_merchant_rating_enforcement', {
    p_suspend_below: body.suspend_below ?? 2.5,
    p_min_reviews: body.min_reviews ?? 10,
    p_sustain_days: body.sustain_days ?? 30,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
