import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../../assert-staff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type Body = { id?: string; reason?: string };

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
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!id) {
    return NextResponse.json({ error: 'Provide withdrawal id.' }, { status: 400 });
  }
  if (reason.length < 8) {
    return NextResponse.json(
      { error: 'Rejection reason must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const { data: row, error: fetchErr } = await admin
    .from('merchant_withdrawals')
    .select('id, merchant_id, amount, status, admin_approved')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: fetchErr?.message ?? 'Withdrawal not found.' }, { status: 404 });
  }
  if (row.status !== 'pending') {
    return NextResponse.json(
      { error: `Only pending withdrawals can be rejected (status: ${row.status}).` },
      { status: 409 },
    );
  }
  if (row.admin_approved === true) {
    return NextResponse.json(
      { error: 'Withdrawal was already approved for payout; use Paystack reversal if needed.' },
      { status: 409 },
    );
  }

  const merchantId = row.merchant_id as string;
  const amount = Number(row.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid withdrawal amount.' }, { status: 500 });
  }

  const { error: rpcErr } = await admin.rpc('merchant_wallet_restore_failed_withdrawal', {
    p_merchant_id: merchantId,
    p_withdrawal_id: id,
    p_amount: amount,
    p_reason: `Ops rejected: ${reason}`,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  const { error: updErr } = await admin
    .from('merchant_withdrawals')
    .update({
      status: 'reversed',
      failure_reason: reason.slice(0, 2000),
      processed_at: new Date().toISOString(),
      admin_id: auth.userId,
    })
    .eq('id', id);

  if (updErr) {
    return NextResponse.json(
      { error: `Wallet restored but withdrawal row update failed: ${updErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
