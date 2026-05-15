import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../assert-staff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ANCHOR_MERCHANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * GET ?scope=all|pending
 * Service-role read so super pages work even when RLS hides `merchants` from the anon client.
 */
export async function GET(req: Request) {
  const auth = await assertStaffOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          'Set SUPABASE_SERVICE_ROLE_KEY on the admin app so super tools can read merchants (bypasses RLS).',
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') ?? 'all';

  if (scope === 'pending') {
    const { data, error } = await admin
      .from('merchants')
      .select(
        'id, business_name, slug, business_email, business_phone, city, state, category, description, application_reference, application_submitted_at, application_rfi_message, owner_full_name, owner_phone, created_at',
      )
      .eq('is_active', false)
      .eq('is_verified', false)
      .eq('is_suspended', false)
      .neq('id', ANCHOR_MERCHANT_ID)
      .order('application_submitted_at', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data ?? [] });
  }

  if (scope !== 'all') {
    return NextResponse.json({ error: 'Invalid scope. Use all or pending.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('merchants')
    .select('id, business_name, slug, business_email, city, is_active, is_featured')
    .order('business_name', { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rows: data ?? [] });
}
