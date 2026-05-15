'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import {
  enrichMerchants,
  isNewMerchant,
  buildFeaturedRows,
  buildFeaturedRowsWithPaidHero,
} from '@/lib/merchantDiscovery';
import { FALLBACK_COORDS } from '@/lib/geo';

const SELECT =
  'id, business_name, slug, logo_url, banner_url, cuisine_types, price_range, avg_prep_minutes, min_order_amount, avg_rating, review_count, is_featured, opening_hours, created_at, latitude, longitude, delivery_radius_km, tagline, description, city, is_suspended';

function fmtNgn(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function MultiVendorHomeSections() {
  const supabase = useMemo(() => createClient(), []);
  const [raw, setRaw] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [paidHeroMerchants, setPaidHeroMerchants] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: flags }, { data: m }, { data: items }] = await Promise.all([
        supabase.from('platform_feature_flags').select('flag_key, enabled'),
        supabase.from('merchants').select(SELECT).eq('is_active', true).order('business_name'),
        supabase
          .from('menu_items')
          .select('id, name, slug, price, image_url, merchant_id, merchants ( business_name, slug )')
          .eq('is_available', true)
          .limit(12),
      ]);
      if (cancelled) return;
      const flagMap = Object.fromEntries((flags || []).map((f) => [f.flag_key, !!f.enabled]));
      const paidOn = !!flagMap.paid_featured_placement;
      setRaw((m || []).filter((x) => !x.is_suspended));
      setPopularItems(items || []);

      if (!paidOn) {
        setPaidHeroMerchants([]);
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const { data: slots } = await supabase
        .from('merchant_featured_slots')
        .select('merchant_id')
        .eq('slot_type', 'homepage_hero')
        .eq('is_active', true)
        .eq('ops_approved', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('amount_paid', { ascending: false })
        .limit(12);
      if (cancelled) return;
      const ids = [...new Set((slots || []).map((s) => s.merchant_id).filter(Boolean))];
      const pool = (m || []).filter((x) => !x.is_suspended);
      const byId = new Map(pool.map((row) => [row.id, row]));
      setPaidHeroMerchants(ids.map((id) => byId.get(id)).filter(Boolean));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const enriched = useMemo(
    () => enrichMerchants(raw, FALLBACK_COORDS.lat, FALLBACK_COORDS.lng),
    [raw],
  );

  const featuredRows = useMemo(() => {
    if (paidHeroMerchants.length > 0) {
      return buildFeaturedRowsWithPaidHero(enriched, paidHeroMerchants);
    }
    return buildFeaturedRows(enriched);
  }, [enriched, paidHeroMerchants]);
  const featured = featuredRows.find((r) => r.id === 'featured')?.items ?? [];

  const explore = useMemo(() => enriched.slice(0, 8), [enriched]);
  const newOnes = useMemo(() => enriched.filter((m) => isNewMerchant(m.created_at)).slice(0, 6), [enriched]);
  const topRated = useMemo(
    () =>
      [...enriched]
        .filter((m) => Number(m.avg_rating) >= 4.6)
        .sort((a, b) => Number(b.avg_rating) - Number(a.avg_rating))
        .slice(0, 6),
    [enriched],
  );

  if (!raw.length && !popularItems.length) {
    return null;
  }

  return (
    <>
      <motion.section
        className="multi-vendor-section container"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45 }}
      >
        <div className="section-header">
          <h2 className="section-title">Explore restaurants near you</h2>
          <Link href="/restaurants" className="view-all">
            See all
          </Link>
        </div>
        <div className="home-multi-scroll">
          {explore.map((m) => (
            <div key={m.id} className="home-multi-card-wrap">
              <RestaurantCard merchant={m} />
            </div>
          ))}
        </div>
      </motion.section>

      {featured.length > 0 && (
        <motion.section
          className="multi-vendor-section container"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
        >
          <div className="section-header">
            <h2 className="section-title">Featured today</h2>
            <Link href="/restaurants" className="view-all">
              Browse
            </Link>
          </div>
          <div className="home-multi-scroll">
            {featured.map((m) => (
              <div key={m.id} className="home-multi-card-wrap">
                <RestaurantCard merchant={m} />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {newOnes.length > 0 && (
        <motion.section
          className="multi-vendor-section container"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
        >
          <div className="section-header">
            <h2 className="section-title">New on Food Stop</h2>
            <Link href="/restaurants" className="view-all">
              Discover
            </Link>
          </div>
          <div className="home-multi-scroll">
            {newOnes.map((m) => (
              <div key={m.id} className="home-multi-card-wrap">
                <RestaurantCard merchant={m} />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {topRated.length > 0 && (
        <motion.section
          className="multi-vendor-section container"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
        >
          <div className="section-header">
            <h2 className="section-title">Top rated</h2>
            <Link href="/restaurants" className="view-all">
              View all
            </Link>
          </div>
          <div className="home-multi-scroll">
            {topRated.map((m) => (
              <div key={m.id} className="home-multi-card-wrap">
                <RestaurantCard merchant={m} />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {popularItems.length > 0 && (
        <motion.section
          className="multi-vendor-section container"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
        >
          <div className="section-header">
            <h2 className="section-title">Popular across restaurants</h2>
            <Link href="/search?q=rice" className="view-all">
              Search dishes
            </Link>
          </div>
          <div className="home-popular-grid">
            {popularItems.map((it) => {
              const mr = it.merchants;
              const mslug = mr?.slug;
              return (
                <div key={it.id} className="home-popular-card card">
                  <div className="home-popular-img-wrap">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt="" className="home-popular-img" />
                    ) : (
                      <div className="home-popular-img home-popular-img--empty" />
                    )}
                  </div>
                  <div className="home-popular-body">
                    <h3>{it.name}</h3>
                    {mr && (
                      <Link href={mslug ? `/restaurants/${mslug}` : '/restaurants'} className="home-popular-merchant">
                        {mr.business_name}
                      </Link>
                    )}
                    <p className="home-popular-price">{fmtNgn(it.price)}</p>
                    {mslug && (
                      <Link href={`/restaurants/${mslug}`} className="btn btn-secondary-outline btn-sm">
                        View store
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}
    </>
  );
}
