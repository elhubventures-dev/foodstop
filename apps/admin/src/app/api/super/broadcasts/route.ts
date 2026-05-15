import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../assert-staff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type Channel = 'in_app' | 'email' | 'sms';
type Audience = 'all_merchants' | 'selected_merchants' | 'all_customers';

type Body = {
  title?: string;
  body?: string;
  channels?: Channel[];
  audience?: Audience;
  merchantIds?: string[];
};

const CHUNK = 400;

export async function POST(req: Request) {
  const auth = await assertStaffOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Set SUPABASE_SERVICE_ROLE_KEY for broadcast fan-out.' },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (title.length < 2 || text.length < 4) {
    return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
  }

  const channels = Array.isArray(body.channels) && body.channels.length > 0 ? body.channels : ['in_app'];
  const audience = body.audience ?? 'all_merchants';
  if (!['all_merchants', 'selected_merchants', 'all_customers'].includes(audience)) {
    return NextResponse.json({ error: 'Invalid audience.' }, { status: 400 });
  }

  const merchantIds =
    audience === 'selected_merchants' && Array.isArray(body.merchantIds)
      ? body.merchantIds.filter((id) => typeof id === 'string' && id.length > 10)
      : null;

  if (audience === 'selected_merchants' && (!merchantIds || merchantIds.length === 0)) {
    return NextResponse.json(
      { error: 'selected_merchants requires merchantIds.' },
      { status: 400 },
    );
  }

  const { data: broadcast, error: insErr } = await admin
    .from('platform_broadcasts')
    .insert({
      title,
      body: text,
      channels,
      audience,
      merchant_ids: merchantIds,
      status: 'sending',
      created_by: auth.userId,
    })
    .select('id')
    .single();

  if (insErr || !broadcast) {
    return NextResponse.json({ error: insErr?.message ?? 'Insert failed.' }, { status: 500 });
  }

  const broadcastId = broadcast.id as string;
  const notes: string[] = [];
  let recipientCount = 0;

  try {
    if (channels.includes('in_app')) {
      if (audience === 'all_customers') {
        const { error: caErr } = await admin.from('customer_announcements').insert({
          title,
          body: text,
          broadcast_id: broadcastId,
        });
        if (caErr) throw new Error(caErr.message);
        recipientCount = 1;
      } else {
        let targetMerchantIds: string[] = [];
        if (audience === 'all_merchants') {
          const { data: merchants, error: mErr } = await admin
            .from('merchants')
            .select('id')
            .eq('is_active', true);
          if (mErr) throw new Error(mErr.message);
          targetMerchantIds = (merchants ?? []).map((r) => r.id as string);
        } else {
          targetMerchantIds = merchantIds ?? [];
        }

        for (let i = 0; i < targetMerchantIds.length; i += CHUNK) {
          const slice = targetMerchantIds.slice(i, i + CHUNK);
          const rows = slice.map((merchant_id) => ({
            merchant_id,
            type: 'platform_broadcast',
            title,
            body: text,
            data: { broadcast_id: broadcastId },
          }));
          const { error: nErr } = await admin.from('merchant_notifications').insert(rows);
          if (nErr) throw new Error(nErr.message);
          recipientCount += slice.length;
        }
      }
    }

    if (channels.includes('email') || channels.includes('sms')) {
      notes.push(
        'Email/SMS channels are recorded on the broadcast but not auto-dispatched from this admin app; wire Termii / internal notify when ready.',
      );
    }

    const { error: finErr } = await admin
      .from('platform_broadcasts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: recipientCount,
        error_detail: notes.length ? notes.join(' ') : null,
      })
      .eq('id', broadcastId);

    if (finErr) throw new Error(finErr.message);

    return NextResponse.json({
      ok: true,
      broadcast_id: broadcastId,
      recipient_count: recipientCount,
      warnings: notes,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Broadcast failed.';
    await admin
      .from('platform_broadcasts')
      .update({ status: 'failed', error_detail: msg })
      .eq('id', broadcastId);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
