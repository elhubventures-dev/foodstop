'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Search, UtensilsCrossed, Store } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import { enrichMerchants } from '@/lib/merchantDiscovery';
import { FALLBACK_COORDS } from '@/lib/geo';
import '../restaurants/restaurants.css';
import './search.css';

function fmtNgn(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function SearchInner() {
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') || '').trim();
  const [tab, setTab] = useState('food');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const { addItem } = useCart();

  const load = useCallback(async () => {
    if (!q) {
      setItems([]);
      setMerchants([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setMerchants(Array.isArray(data.merchants) ? data.merchants : []);
    } catch {
      setItems([]);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const enrichedMerchants = useMemo(
    () => enrichMerchants(merchants, FALLBACK_COORDS.lat, FALLBACK_COORDS.lng),
    [merchants],
  );

  const onAddItem = (row) => {
    const m = row.merchants;
    if (!m?.slug) return;
    addItem({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      image_url: row.image_url,
      slug: row.slug,
      merchant_id: row.merchant_id,
      merchant_name: m.business_name,
      quantity: 1,
      subtotal: Number(row.price),
    });
  };

  return (
    <div className="search-page container" style={{ padding: '2rem 0 4rem' }}>
      <h1 className="restaurants-hero-title" style={{ marginBottom: '0.5rem' }}>
        Search
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Find dishes and restaurants across Food Stop.
      </p>

      <form className="search-page-bar" action="/search" method="get">
        <Search size={20} className="restaurants-search-icon" />
        <input
          className="restaurants-search-input"
          name="q"
          defaultValue={q}
          placeholder="Jollof, suya, restaurant name…"
          aria-label="Search"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {!q && (
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2rem' }}>
          Enter a search term to see results.
        </p>
      )}

      {q && (
        <>
          <div className="search-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'food'}
              className={`search-tab ${tab === 'food' ? 'active' : ''}`}
              onClick={() => setTab('food')}
            >
              <UtensilsCrossed size={18} style={{ marginRight: 8 }} />
              Food ({items.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'restaurants'}
              className={`search-tab ${tab === 'restaurants' ? 'active' : ''}`}
              onClick={() => setTab('restaurants')}
            >
              <Store size={18} style={{ marginRight: 8 }} />
              Restaurants ({merchants.length})
            </button>
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '2rem' }}>
              <Loader2 className="spin-icon" size={22} />
              Searching…
            </div>
          )}

          {!loading && tab === 'food' && (
            <ul className="search-item-grid">
              {items.map((row) => {
                const m = row.merchants;
                return (
                  <li key={row.id} className="search-item-card card">
                    <div className="search-item-img-wrap">
                      {row.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.image_url} alt="" className="search-item-img" />
                      ) : (
                        <div className="search-item-img search-item-img--empty" />
                      )}
                    </div>
                    <div className="search-item-body">
                      <h3>{row.name}</h3>
                      {m && (
                        <Link href={`/restaurants/${m.slug}`} className="search-item-merchant">
                          {m.business_name}
                        </Link>
                      )}
                      <p className="search-item-price">{fmtNgn(row.price)}</p>
                      <button type="button" className="btn btn-primary btn-block" onClick={() => onAddItem(row)}>
                        Add to cart
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && tab === 'food' && items.length === 0 && q && (
            <p style={{ marginTop: '1.5rem', color: 'var(--color-text-secondary)' }}>No dishes match that search.</p>
          )}

          {!loading && tab === 'restaurants' && (
            <div className="search-merchant-grid">
              {enrichedMerchants.map((m) => (
                <RestaurantCard key={m.id} merchant={m} />
              ))}
            </div>
          )}

          {!loading && tab === 'restaurants' && merchants.length === 0 && q && (
            <p style={{ marginTop: '1.5rem', color: 'var(--color-text-secondary)' }}>
              No restaurants match that search.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem' }}>Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}
