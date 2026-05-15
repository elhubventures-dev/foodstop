import { haversineKm } from '@/lib/geo';
import { isOpenNow } from '@/lib/openingHours';

export const DEFAULT_DELIVERY_FEE_NGN = 500;

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'rating', label: 'Rating' },
  { id: 'delivery_time', label: 'Delivery time' },
  { id: 'min_order', label: 'Min. order' },
];

export const RATING_FILTERS = [
  { id: 'any', label: 'Any', min: 0 },
  { id: '4', label: '4.0+', min: 4 },
  { id: '4.5', label: '4.5+', min: 4.5 },
  { id: '4.8', label: '4.8+', min: 4.8 },
];

/** Stable list for filter chips (extend as merchants onboard). */
export const CUISINE_PRESETS = [
  'Nigerian',
  'Chinese',
  'Continental',
  'Fast Food',
  'Grill',
  'Bakery',
  'Seafood',
  'Vegetarian',
  'Local',
];

export function priceRangeLabel(priceRange) {
  const n = Math.min(4, Math.max(1, Number(priceRange) || 2));
  return '₦'.repeat(n);
}

export function enrichMerchants(merchants, userLat, userLng) {
  return merchants.map((m) => {
    let distanceKm = null;
    if (
      m.latitude != null &&
      m.longitude != null &&
      userLat != null &&
      userLng != null
    ) {
      distanceKm = haversineKm(
        userLat,
        userLng,
        Number(m.latitude),
        Number(m.longitude)
      );
    }
    return {
      ...m,
      distanceKm,
      isOpen: isOpenNow(m.opening_hours),
    };
  });
}

function cuisineMatch(merchant, selected) {
  if (selected.length === 0) return true;
  const types = (merchant.cuisine_types || []).map((t) => String(t));
  return selected.some((c) => types.includes(c));
}

export function applyDiscoveryFilters(
  list,
  {
    openNow,
    cuisine,
    minRating,
    maxDistanceKm,
    search,
  }
) {
  const q = (search || '').trim().toLowerCase();
  return list.filter((m) => {
    if (openNow && !m.isOpen) return false;
    if (!cuisineMatch(m, cuisine)) return false;
    const ar = Number(m.avg_rating) || 0;
    if (ar < minRating) return false;
    if (m.distanceKm != null && m.distanceKm > maxDistanceKm) return false;
    if (q) {
      const blob = [
        m.business_name,
        m.tagline,
        m.description,
        m.city,
        ...(m.cuisine_types || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

export function sortMerchants(list, sortId) {
  const copy = [...list];
  switch (sortId) {
    case 'rating':
      return copy.sort(
        (a, b) => (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0)
      );
    case 'delivery_time':
      return copy.sort(
        (a, b) =>
          (Number(a.avg_prep_minutes) || 99) -
          (Number(b.avg_prep_minutes) || 99)
      );
    case 'min_order':
      return copy.sort(
        (a, b) =>
          (Number(a.min_order_amount) || 0) -
          (Number(b.min_order_amount) || 0)
      );
    case 'relevance':
    default:
      return copy.sort((a, b) => {
        const fB = b.is_featured ? 1 : 0;
        const fA = a.is_featured ? 1 : 0;
        if (fB !== fA) return fB - fA;
        const dA = a.distanceKm;
        const dB = b.distanceKm;
        if (dA != null && dB != null && dA !== dB) return dA - dB;
        return (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0);
      });
  }
}

const NEW_DAYS = 30;

export function isNewMerchant(createdAt) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < NEW_DAYS * 24 * 60 * 60 * 1000;
}

export function isFastDelivery(merchant) {
  return (Number(merchant.avg_prep_minutes) || 99) <= 25;
}

export function isTopRated(merchant) {
  return (Number(merchant.avg_rating) || 0) >= 4.7;
}

/**
 * When paid featured placement is on, replace the "featured" row with paid hero
 * merchants (same objects as in enriched). `heroMerchants` should be ordered.
 */
export function buildFeaturedRowsWithPaidHero(enriched, heroMerchants) {
  const base = buildFeaturedRows(enriched);
  if (!heroMerchants || heroMerchants.length === 0) {
    return base;
  }
  return base.map((row) =>
    row.id === 'featured'
      ? {
          ...row,
          title: 'Featured partners',
          items: heroMerchants.slice(0, 8),
        }
      : row,
  );
}

export function buildFeaturedRows(enriched) {
  const active = enriched.filter((m) => m.isOpen !== false);
  const pool = active.length ? active : enriched;

  const featured = pool
    .filter((m) => m.is_featured)
    .sort(
      (a, b) => (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0)
    )
    .slice(0, 5);

  const newest = [...pool]
    .filter((m) => isNewMerchant(m.created_at))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 8);

  const topRated = [...pool]
    .filter((m) => isTopRated(m))
    .sort(
      (a, b) => (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0)
    )
    .slice(0, 8);

  const fast = [...pool]
    .filter((m) => isFastDelivery(m))
    .sort(
      (a, b) =>
        (Number(a.avg_prep_minutes) || 99) -
        (Number(b.avg_prep_minutes) || 99)
    )
    .slice(0, 8);

  return [
    { id: 'featured', title: 'Featured restaurants', items: featured },
    { id: 'new', title: 'New on ChopFast', items: newest },
    { id: 'top', title: 'Top rated near you', items: topRated },
    { id: 'fast', title: 'Fast delivery', items: fast },
  ].filter((row) => row.items.length > 0);
}
