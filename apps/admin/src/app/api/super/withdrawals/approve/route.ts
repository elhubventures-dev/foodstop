import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../../assert-staff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type Body = { ids?: string[] };

export async function POST(req: Request) {
  const auth = await assertStaffOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Set SUPABASE_SERVICE_ROLE_KEY on the admin server for payout actions.' },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === 'string' && id.length > 0) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Provide non-empty ids array.' }, { status: 400 });
  }

  const { error } = await admin
    .from('merchant_withdrawals')
    .update({
      admin_approved: true,
      admin_id: auth.userId,
    })
    .in('id', ids)
    .eq('status', 'pending')
    .eq('admin_approved', false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, approved: ids.length });
}
