'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, MapPin, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import {
  SORT_OPTIONS,
  RATING_FILTERS,
  CUISINE_PRESETS,
  enrichMerchants,
  applyDiscoveryFilters,
  sortMerchants,
  buildFeaturedRows,
  DEFAULT_DELIVERY_FEE_NGN,
} from '@/lib/merchantDiscovery';
import { FALLBACK_COORDS } from '@/lib/geo';

const SELECT_FIELDS =
  'id, business_name, slug, logo_url, banner_url, cuisine_types, price_range, avg_prep_minutes, min_order_amount, avg_rating, review_count, is_featured, opening_hours, created_at, latitude, longitude, delivery_radius_km, tagline, description, city, is_suspended';

export default function RestaurantDiscovery() {
  const supabase = useMemo(() => createClient(), []);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('pending');

  const [search, setSearch] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [cuisine, setCuisine] = useState(() => new Set());
  const [ratingId, setRatingId] = useState('any');
  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  const [sortId, setSortId] = useState('relevance');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, err } = await supabase
        .from('merchants')
        .select(SELECT_FIELDS)
        .eq('is_active', true)
        .order('business_name');
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setRaw([]);
      } else {
        const rows = (data || []).filter((m) => !m.is_suspended);
        setRaw(rows);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserCoords(FALLBACK_COORDS);
      setGeoStatus('fallback');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoStatus('ok');
      },
      () => {
        setUserCoords(FALLBACK_COORDS);
        setGeoStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }, []);

  const userLat = userCoords?.lat ?? FALLBACK_COORDS.lat;
  const userLng = userCoords?.lng ?? FALLBACK_COORDS.lng;

  const enriched = useMemo(
    () => enrichMerchants(raw, userLat, userLng),
    [raw, userLat, userLng]
  );

  const minRating = useMemo(() => {
    const f = RATING_FILTERS.find((r) => r.id === ratingId);
    return f?.min ?? 0;
  }, [ratingId]);

  const cuisineArray = useMemo(() => [...cuisine], [cuisine]);

  const filtered = useMemo(() => {
    const list = applyDiscoveryFilters(enriched, {
      openNow,
      cuisine: cuisineArray,
      minRating,
      maxDistanceKm,
      search,
    });
    return sortMerchants(list, sortId);
  }, [
    enriched,
    openNow,
    cuisineArray,
    minRating,
    maxDistanceKm,
    search,
    sortId,
  ]);

  const featuredRows = useMemo(() => buildFeaturedRows(enriched), [enriched]);

  const toggleCuisine = useCallback((c) => {
    setCuisine((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setOpenNow(false);
    setCuisine(new Set());
    setRatingId('any');
    setMaxDistanceKm(10);
    setSearch('');
    setSortId('relevance');
  }, []);

  const activeChips = useMemo(() => {
    const chips = [];
    if (openNow) chips.push({ key: 'open', label: 'Open now' });
    cuisineArray.forEach((c) =>
      chips.push({ key: `cuisine-${c}`, label: c })
    );
    if (ratingId !== 'any') {
      const rl = RATING_FILTERS.find((r) => r.id === ratingId);
      if (rl) chips.push({ key: 'rating', label: rl.label });
    }
    if (maxDistanceKm < 10) {
      chips.push({
        key: 'distance',
        label: `Within ${maxDistanceKm} km`,
      });
    }
    return chips;
  }, [openNow, cuisineArray, ratingId, maxDistanceKm]);

  const removeChip = useCallback((key) => {
    if (key === 'open') setOpenNow(false);
    if (key.startsWith('cuisine-')) {
      const c = key.slice('cuisine-'.length);
      setCuisine((prev) => {
        const next = new Set(prev);
        next.delete(c);
        return next;
      });
    }
    if (key === 'rating') setRatingId('any');
    if (key === 'distance') setMaxDistanceKm(10);
  }, []);

  return (
    <div className="restaurants-discovery">
      <section className="restaurants-hero">
        <div className="container">
          <p className="restaurants-eyebrow">Food Stop marketplace</p>
          <h1 className="restaurants-hero-title">Explore restaurants near you</h1>
          <p className="restaurants-hero-sub">
            Discover verified kitchens, filter by cuisine and rating, and order
            in a few taps. Sample cards show delivery from ₦
            {DEFAULT_DELIVERY_FEE_NGN.toLocaleString('en-NG')}.
          </p>
          <div className="restaurants-hero-bar">
            <div className="restaurants-search-wrap">
              <Search size={20} className="restaurants-search-icon" />
              <input
                type="search"
                className="restaurants-search-input"
                placeholder="Search name, city, or cuisine…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search restaurants"
              />
            </div>
            <div className="restaurants-locate">
              <MapPin size={18} />
              <span>
                {geoStatus === 'ok' && 'Using your location for distance'}
                {geoStatus === 'denied' &&
                  'Distance from a default Abuja pin (enable location for accuracy)'}
                {geoStatus === 'fallback' && 'Geolocation not available — using default map centre'}
                {geoStatus === 'pending' && 'Locating…'}
              </span>
            </div>
          </div>
          {geoStatus === 'denied' && (
            <p className="restaurants-geo-note">
              Location permission denied — showing distances from a default Abuja
              pin. Enable location in your browser for accurate km.
            </p>
          )}
        </div>
      </section>

      <div className="container restaurants-toolbar">
        <button
          type="button"
          className="restaurants-filter-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal size={18} />
          Filters
        </button>
        <label className="restaurants-sort">
          <span className="sr-only">Sort by</span>
          Sort:
          <select
            value={sortId}
            onChange={(e) => setSortId(e.target.value)}
            className="restaurants-sort-select"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {activeChips.length > 0 && (
        <div className="container restaurants-chips">
          {activeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              className="filter-chip"
              onClick={() => removeChip(c.key)}
            >
              {c.label}
              <X size={14} aria-hidden />
            </button>
          ))}
          <button type="button" className="link-reset" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      <div
        className={`container restaurants-layout ${
          filtersOpen ? 'filters-open' : ''
        }`}
      >
        <aside
          className="restaurants-filters"
          aria-label="Restaurant filters"
        >
          <div className="filter-block">
            <span className="filter-label">Open now</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
              />
              <span>Show only open (Lagos time)</span>
            </label>
          </div>
          <div className="filter-block">
            <span className="filter-label">Cuisine</span>
            <div className="filter-cuisine-grid">
              {CUISINE_PRESETS.map((c) => (
                <label key={c} className="cuisine-check">
                  <input
                    type="checkbox"
                    checked={cuisine.has(c)}
                    onChange={() => toggleCuisine(c)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <span className="filter-label">Minimum rating</span>
            <div className="filter-rating-row">
              {RATING_FILTERS.map((r) => (
                <label key={r.id} className="radio-pill">
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingId === r.id}
                    onChange={() => setRatingId(r.id)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <span className="filter-label">
              Max distance: {maxDistanceKm} km
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              className="distance-slider"
            />
            <p className="filter-hint">
              Merchants without map pins still appear if no distance is set.
            </p>
          </div>
        </aside>

        <div className="restaurants-main">
          {loading && (
            <div className="restaurants-loading">
              <Loader2 size={28} className="spin-icon" />
              <span>Loading restaurants…</span>
            </div>
          )}
          {error && (
            <p className="restaurants-error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && raw.length === 0 && (
            <p className="restaurants-empty">
              No active merchants yet. Check back soon.
            </p>
          )}
          {!loading && !error && raw.length > 0 && (
            <>
              {featuredRows.map((row) => (
                <section key={row.id} className="discovery-section">
                  <div className="discovery-section-head">
                    <h2>{row.title}</h2>
                  </div>
                  <div className="discovery-row">
                    {row.items.map((m) => (
                      <div key={m.id} className="discovery-row-item">
                        <RestaurantCard merchant={m} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <section className="discovery-section all-results">
                <div className="discovery-section-head">
                  <h2>
                    {filtered.length === enriched.length
                      ? 'All restaurants'
                      : `Results (${filtered.length})`}
                  </h2>
                </div>
                {filtered.length === 0 ? (
                  <p className="restaurants-empty">
                    No restaurants match your filters.{' '}
                    <button
                      type="button"
                      className="link-reset"
                      onClick={clearFilters}
                    >
                      Reset filters
                    </button>
                  </p>
                ) : (
                  <div className="restaurants-grid">
                    {filtered.map((m) => (
                      <RestaurantCard key={m.id} merchant={m} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
