'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MapPin, Star, Share2, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import { DEFAULT_DELIVERY_FEE_NGN, priceRangeLabel } from '@/lib/merchantDiscovery';

function fmtNgn(n) {
  const v = Number(n) || 0;
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function MerchantStorefront({ slug }) {
  const supabase = useMemo(() => createClient(), []);
  const { addItem } = useCart();

  const [merchant, setMerchant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [promos, setPromos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCat, setActiveCat] = useState('all');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: m, error: mErr } = await supabase
        .from('merchants')
        .select(
          'id, business_name, slug, logo_url, banner_url, description, city, state, business_address, opening_hours, cuisine_types, price_range, avg_prep_minutes, min_order_amount, avg_rating, review_count, is_active, is_suspended, tagline',
        )
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;
      if (mErr || !m || !m.is_active || m.is_suspended) {
        setNotFound(true);
        setMerchant(null);
        setLoading(false);
        return;
      }

      setMerchant(m);
      setNotFound(false);

      const [{ data: items }, { data: promoRows }, { data: revRows }] = await Promise.all([
        supabase
          .from('menu_items')
          .select(
            'id, name, slug, description, price, image_url, display_order, category_id, categories ( id, name, slug, display_order )',
          )
          .eq('merchant_id', m.id)
          .eq('is_available', true)
          .order('display_order'),
        supabase
          .from('merchant_promotions')
          .select('code, discount_type, discount_value, min_order')
          .eq('merchant_id', m.id)
          .eq('is_active', true)
          .limit(6),
        supabase
          .from('merchant_reviews')
          .select('food_rating, service_rating, review_text, reply_text, created_at')
          .eq('merchant_id', m.id)
          .order('created_at', { ascending: false })
          .limit(12),
      ]);

      if (!cancelled) {
        const normalized = (items || []).map((row) => ({
          ...row,
          category_slug: row.categories?.slug || 'other',
          category_name: row.categories?.name || 'Menu',
        }));
        setMenuItems(normalized);
        setPromos(promoRows || []);
        setReviews(revRows || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, supabase]);

  const categories = useMemo(() => {
    const map = new Map();
    for (const row of menuItems) {
      const key = row.category_slug || 'other';
      if (!map.has(key)) {
        map.set(key, {
          slug: key,
          name: row.category_name || 'Menu',
          order: row.categories?.display_order ?? 999,
        });
      }
    }
    if (map.size === 0 && menuItems.length) {
      map.set('other', { slug: 'other', name: 'Menu', order: 0 });
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (activeCat === 'all') return menuItems;
    return menuItems.filter((i) => i.category_slug === activeCat);
  }, [menuItems, activeCat]);

  const groupedByCategory = useMemo(() => {
    const map = new Map();
    for (const item of menuItems) {
      const k = item.category_slug || 'other';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    }
    return map;
  }, [menuItems]);

  const scrollToCat = useCallback((slugKey) => {
    setActiveCat(slugKey);
    if (slugKey === 'all') return;
    const el = document.getElementById(`storefront-cat-${slugKey}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleAdd = useCallback(
    (item) => {
      if (!merchant) return;
      addItem({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image_url: item.image_url,
        slug: item.slug,
        merchant_id: merchant.id,
        merchant_name: merchant.business_name,
        quantity: 1,
        subtotal: Number(item.price),
      });
    },
    [addItem, merchant],
  );

  if (loading) {
    return (
      <div className="container restaurants-loading" style={{ padding: '4rem' }}>
        <Loader2 size={28} className="spin-icon" />
        <span>Loading…</span>
      </div>
    );
  }

  if (notFound || !merchant) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h1 className="restaurants-hero-title">Restaurant not found</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          This store may be inactive or the link is incorrect.
        </p>
        <Link href="/restaurants" className="link-reset" style={{ fontSize: '1rem' }}>
          ← Back to restaurants
        </Link>
      </div>
    );
  }

  const cuisines = (merchant.cuisine_types || []).slice(0, 3).join(' · ') || 'Restaurant';
  const rating = Number(merchant.avg_rating) || 0;
  const reviewsN = Number(merchant.review_count) || 0;
  const minOrder = Number(merchant.min_order_amount) || 0;
  const prep = Number(merchant.avg_prep_minutes) || 35;
  const deliveryFee = DEFAULT_DELIVERY_FEE_NGN;

  return (
    <div className="merchant-storefront">
      <section
        className="storefront-hero storefront-hero--full"
        style={
          merchant.banner_url
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${merchant.banner_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#fff',
              }
            : {}
        }
      >
        <div className="container">
          <Link
            href="/restaurants"
            className="btn-outline"
            style={{
              marginBottom: '1.5rem',
              borderColor: 'rgba(255,255,255,0.8)',
              color: '#fff',
            }}
          >
            <ArrowLeft size={18} style={{ marginRight: 8 }} />
            All restaurants
          </Link>
          <div className="storefront-hero-row">
            {merchant.logo_url ? (
              <img
                src={merchant.logo_url}
                alt=""
                width={96}
                height={96}
                className="storefront-logo"
              />
            ) : (
              <div className="storefront-logo storefront-logo--placeholder" aria-hidden />
            )}
            <div>
              <h1 className="storefront-title">{merchant.business_name}</h1>
              <p className="storefront-meta">
                {cuisines} · {priceRangeLabel(merchant.price_range)} ·{' '}
                <Star size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                {rating.toFixed(1)} ({reviewsN} reviews)
              </p>
              <p className="storefront-sub">
                <MapPin size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {merchant.city}
                {merchant.state ? `, ${merchant.state}` : ''} · ~{prep} min · Min {fmtNgn(minOrder)}{' '}
                · Delivery from {fmtNgn(deliveryFee)}
              </p>
              <div className="storefront-toolbar">
                <button type="button" className="storefront-icon-btn" aria-label="Share store">
                  <Share2 size={18} />
                </button>
                <button type="button" className="storefront-icon-btn" aria-label="Favourite">
                  <Heart size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container storefront-body">
        {promos.length > 0 && (
          <div className="storefront-promo-banner">
            {promos.map((p) => (
              <span key={p.code} className="storefront-promo-chip">
                Use code <strong>{p.code}</strong>
                {p.discount_type === 'percent'
                  ? ` · ${p.discount_value}% off`
                  : p.discount_type === 'fixed'
                    ? ` · ${fmtNgn(p.discount_value)} off`
                    : ' · Free delivery'}
                {Number(p.min_order) > 0 ? ` · Min ${fmtNgn(p.min_order)}` : ''}
              </span>
            ))}
          </div>
        )}

        {merchant.description && (
          <section className="storefront-about card">
            <h2>About</h2>
            <p>{merchant.description}</p>
            {merchant.tagline && <p className="storefront-tagline">{merchant.tagline}</p>}
          </section>
        )}

        <section className="storefront-menu-section">
          <h2 className="storefront-menu-title">Menu</h2>
          <div className="storefront-cat-tabs" role="tablist">
            <button
              type="button"
              className={`storefront-cat-tab ${activeCat === 'all' ? 'active' : ''}`}
              onClick={() => scrollToCat('all')}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`storefront-cat-tab ${activeCat === c.slug ? 'active' : ''}`}
                onClick={() => scrollToCat(c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {activeCat === 'all'
            ? categories.map((c) => {
                const rows = groupedByCategory.get(c.slug) || [];
                if (!rows.length) return null;
                return (
                  <div key={c.slug} id={`storefront-cat-${c.slug}`} className="storefront-category-block">
                    <h3 className="storefront-category-heading">{c.name}</h3>
                    <div className="storefront-item-grid">
                      {rows.map((item) => (
                        <article key={item.id} className="storefront-item-card">
                          <div className="storefront-item-img-wrap">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="storefront-item-img" />
                            ) : (
                              <div className="storefront-item-img storefront-item-img--empty" />
                            )}
                          </div>
                          <div className="storefront-item-body">
                            <h4>{item.name}</h4>
                            {item.description && (
                              <p className="storefront-item-desc">{item.description}</p>
                            )}
                            <div className="storefront-item-footer">
                              <span className="storefront-item-price">{fmtNgn(item.price)}</span>
                              <button type="button" className="btn btn-primary" onClick={() => handleAdd(item)}>
                                Add
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })
            : (
              <div className="storefront-item-grid">
                {filteredItems.map((item) => (
                  <article key={item.id} className="storefront-item-card">
                    <div className="storefront-item-img-wrap">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="storefront-item-img" />
                      ) : (
                        <div className="storefront-item-img storefront-item-img--empty" />
                      )}
                    </div>
                    <div className="storefront-item-body">
                      <h4>{item.name}</h4>
                      {item.description && <p className="storefront-item-desc">{item.description}</p>}
                      <div className="storefront-item-footer">
                        <span className="storefront-item-price">{fmtNgn(item.price)}</span>
                        <button type="button" className="btn btn-primary" onClick={() => handleAdd(item)}>
                          Add
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>

        {reviews.length > 0 && (
          <section className="storefront-reviews card">
            <h2>Reviews</h2>
            <p className="storefront-reviews-summary">
              Overall {rating.toFixed(1)} · {reviewsN} reviews on Food Stop
            </p>
            <ul className="storefront-review-list">
              {reviews.map((r, idx) => (
                <li key={idx} className="storefront-review-item">
                  <div className="storefront-review-stars">
                    {'★'.repeat(Math.min(5, Math.round(Number(r.food_rating) || 0)))}
                  </div>
                  {r.review_text && <p>{r.review_text}</p>}
                  {r.reply_text && (
                    <p className="storefront-review-reply">
                      <strong>Restaurant:</strong> {r.reply_text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
