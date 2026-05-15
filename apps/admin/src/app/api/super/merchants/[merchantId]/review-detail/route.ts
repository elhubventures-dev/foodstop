import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../../../assert-staff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ merchantId: string }> },
) {
  const auth = await assertStaffOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          'Set SUPABASE_SERVICE_ROLE_KEY on the admin app so super tools can read KYC data.',
      },
      { status: 503 },
    );
  }

  const { merchantId } = await ctx.params;
  if (!merchantId || merchantId.length < 10) {
    return NextResponse.json({ error: 'Invalid merchant id.' }, { status: 400 });
  }

  const [{ data: docs, error: dErr }, { data: bank, error: bErr }] = await Promise.all([
    admin
      .from('merchant_documents')
      .select('id, doc_type, doc_url, status, created_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: true }),
    admin
      .from('merchant_bank_accounts')
      .select('bank_name, account_number, account_name')
      .eq('merchant_id', merchantId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (dErr) {
    return NextResponse.json({ error: dErr.message }, { status: 500 });
  }
  if (bErr) {
    return NextResponse.json({ error: bErr.message }, { status: 500 });
  }

  return NextResponse.json({
    documents: docs ?? [],
    bank: bank ?? null,
  });
}
