import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../../assert-staff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type Action = 'approve' | 'reject' | 'rfi';

type Body = {
  merchantId?: string;
  action?: Action;
  message?: string;
};

export async function POST(req: Request) {
  const auth = await assertStaffOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          'Set SUPABASE_SERVICE_ROLE_KEY on the admin app so super tools can update merchants.',
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const merchantId = typeof body.merchantId === 'string' ? body.merchantId.trim() : '';
  const action = body.action;
  const note = typeof body.message === 'string' ? body.message.trim() : '';

  if (!merchantId || merchantId.length < 10) {
    return NextResponse.json({ error: 'merchantId is required.' }, { status: 400 });
  }
  if (action !== 'approve' && action !== 'reject' && action !== 'rfi') {
    return NextResponse.json({ error: 'action must be approve, reject, or rfi.' }, { status: 400 });
  }

  if (action === 'reject' || action === 'rfi') {
    if (note.length < 8) {
      return NextResponse.json(
        { error: 'message must be at least 8 characters for reject or rfi.' },
        { status: 400 },
      );
    }
  }

  const reviewerId = auth.userId;

  if (action === 'approve') {
    const { error: mErr } = await admin
      .from('merchants')
      .update({
        is_active: true,
        is_verified: true,
        is_suspended: false,
        suspension_reason: null,
        application_rfi_message: null,
      })
      .eq('id', merchantId);
    if (mErr) {
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    const { error: docErr } = await admin
      .from('merchant_documents')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewer_id: reviewerId,
      })
      .eq('merchant_id', merchantId)
      .eq('status', 'pending');
    if (docErr) {
      return NextResponse.json({ error: docErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'reject') {
    const { error: mErr } = await admin
      .from('merchants')
      .update({
        is_suspended: true,
        suspension_reason: `Application rejected: ${note}`,
      })
      .eq('id', merchantId);
    if (mErr) {
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    const { error: docErr } = await admin
      .from('merchant_documents')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewer_id: reviewerId,
        reviewer_note: note,
      })
      .eq('merchant_id', merchantId)
      .eq('status', 'pending');
    if (docErr) {
      return NextResponse.json({ error: docErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // rfi
  const { error: mErr } = await admin
    .from('merchants')
    .update({ application_rfi_message: note })
    .eq('id', merchantId);
  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
