import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

function sanitizeIlike(q) {
  return (q || '').replace(/[%_]/g, '').trim();
}

const ITEM_SELECT =
  'id, name, slug, price, image_url, description, merchant_id, merchants ( id, business_name, slug, is_active, is_suspended )';

const MERCHANT_SELECT =
  'id, business_name, slug, logo_url, banner_url, city, cuisine_types, avg_rating, review_count, is_active, is_suspended';

/**
 * GET /api/search?q=...&limit=24
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = sanitizeIlike(searchParams.get('q') || '');
    const limit = Math.min(40, Math.max(1, Number(searchParams.get('limit')) || 24));

    if (!q) {
      return NextResponse.json({ items: [], merchants: [] });
    }

    const pattern = `%${q}%`;

    const { data: activeMerchants } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('is_active', true)
      .eq('is_suspended', false);

    const activeIds = (activeMerchants || []).map((r) => r.id);
    if (!activeIds.length) {
      return NextResponse.json({ items: [], merchants: [] });
    }

    const [{ data: itemsByName }, { data: itemsByDesc }, { data: mName }, { data: mDesc }] =
      await Promise.all([
        supabaseAdmin
          .from('menu_items')
          .select(ITEM_SELECT)
          .eq('is_available', true)
          .in('merchant_id', activeIds)
          .ilike('name', pattern)
          .limit(limit),
        supabaseAdmin
          .from('menu_items')
          .select(ITEM_SELECT)
          .eq('is_available', true)
          .in('merchant_id', activeIds)
          .ilike('description', pattern)
          .limit(limit),
        supabaseAdmin
          .from('merchants')
          .select(MERCHANT_SELECT)
          .eq('is_active', true)
          .eq('is_suspended', false)
          .ilike('business_name', pattern)
          .limit(limit),
        supabaseAdmin
          .from('merchants')
          .select(MERCHANT_SELECT)
          .eq('is_active', true)
          .eq('is_suspended', false)
          .ilike('description', pattern)
          .limit(limit),
      ]);

    const itemMap = new Map();
    for (const row of [...(itemsByName || []), ...(itemsByDesc || [])]) {
      const m = row.merchants;
      if (!m || m.is_suspended || !m.is_active) continue;
      itemMap.set(row.id, row);
    }
    const items = [...itemMap.values()].slice(0, limit);

    const merchMap = new Map();
    for (const row of [...(mName || []), ...(mDesc || [])]) {
      merchMap.set(row.id, row);
    }
    const merchants = [...merchMap.values()].slice(0, limit);

    return NextResponse.json({ items, merchants });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Search failed' }, { status: 500 });
  }
}
