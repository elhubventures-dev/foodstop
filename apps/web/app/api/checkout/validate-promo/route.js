import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEFAULT_MERCHANT =
  process.env.NEXT_PUBLIC_ANCHOR_MERCHANT_ID ?? '00000000-0000-0000-0000-000000000001';

/**
 * POST { merchant_id?, code, subtotal, delivery_fee }
 * Validates against merchant_promotions via RPC (same rules as ChopFast API).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const merchant_id = body.merchant_id || DEFAULT_MERCHANT;
    const code = typeof body.code === 'string' ? body.code : '';
    const subtotal = Number(body.subtotal);
    const delivery_fee = Number(body.delivery_fee);

    if (!code.trim()) {
      return NextResponse.json({ valid: false, reason: 'missing' }, { status: 400 });
    }
    if (!Number.isFinite(subtotal) || subtotal < 0 || !Number.isFinite(delivery_fee) || delivery_fee < 0) {
      return NextResponse.json({ valid: false, reason: 'bad_amounts' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('validate_merchant_promo', {
      p_merchant_id: merchant_id,
      p_code: code,
      p_subtotal: subtotal,
      p_delivery_fee: delivery_fee,
    });

    if (error) {
      console.error('validate_merchant_promo', error);
      return NextResponse.json({ valid: false, reason: 'rpc_error' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 500 });
  }
}
