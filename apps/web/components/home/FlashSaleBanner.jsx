'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function FlashSaleBanner() {
  const [sale, setSale] = useState(null);
  const [flagOn, setFlagOn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: flags } = await supabase
        .from('platform_feature_flags')
        .select('enabled')
        .eq('flag_key', 'platform_flash_sales')
        .maybeSingle();
      if (cancelled) return;
      if (!flags?.enabled) {
        setFlagOn(false);
        setSale(null);
        return;
      }
      setFlagOn(true);
      const nowIso = new Date().toISOString();
      const { data: rows } = await supabase
        .from('platform_flash_sales')
        .select('id, title, discount_type, discount_value, start_at, end_at, budget_cap, amount_used')
        .eq('is_active', true)
        .lte('start_at', nowIso)
        .gte('end_at', nowIso)
        .order('start_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      const row = rows?.[0];
      if (!row) {
        setSale(null);
        return;
      }
      const cap = row.budget_cap != null ? Number(row.budget_cap) : null;
      const used = row.amount_used != null ? Number(row.amount_used) : 0;
      if (cap != null && used >= cap) {
        setSale(null);
        return;
      }
      setSale(row);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!flagOn || !sale?.title) return null;

  let detail = '';
  if (sale.discount_type === 'free_delivery') detail = 'Free delivery on eligible orders.';
  else if (sale.discount_type === 'percent' && sale.discount_value != null) {
    detail = `${Number(sale.discount_value)}% off participating merchants.`;
  } else if (sale.discount_type === 'fixed' && sale.discount_value != null) {
    detail = `₦${Number(sale.discount_value).toLocaleString('en-NG')} off — limited time.`;
  } else detail = 'Limited-time platform promotion.';

  return (
    <div
      className="flash-sale-banner"
      style={{
        background: 'linear-gradient(90deg, #7c2d12 0%, #ea580c 50%, #f59e0b 100%)',
        color: '#fffbeb',
        padding: '0.65rem 1rem',
        textAlign: 'center',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      <Zap size={18} style={{ flexShrink: 0 }} aria-hidden />
      <strong>{sale.title}</strong>
      <span style={{ opacity: 0.95 }}>{detail}</span>
      <Link href="/restaurants" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>
        Shop now
      </Link>
    </div>
  );
}
