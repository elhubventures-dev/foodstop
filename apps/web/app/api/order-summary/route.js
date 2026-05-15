import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/order-summary?id=<uuid>
 * Limited public summary for order confirmation / tracking (no full address payload).
 */
export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(
        'id, status, subtotal, delivery_fee, discount, total, created_at, merchant_id, merchants ( business_name, slug, logo_url )',
      )
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: lines } = await supabaseAdmin
      .from('order_items')
      .select('name, quantity, price, subtotal')
      .eq('order_id', id);

    const m = order.merchants;
    const merchant = Array.isArray(m) ? m[0] : m;

    return NextResponse.json({
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      discount: order.discount,
      total: order.total,
      created_at: order.created_at,
      items: lines || [],
      merchant: merchant
        ? {
            business_name: merchant.business_name,
            slug: merchant.slug,
            logo_url: merchant.logo_url,
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
