'use client';

import Link from 'next/link';
import {
  DEFAULT_DELIVERY_FEE_NGN,
  isNewMerchant,
  isFastDelivery,
  priceRangeLabel,
} from '@/lib/merchantDiscovery';
import { formatDistanceKm } from '@/lib/geo';

function fmtNgn(n) {
  const v = Number(n) || 0;
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function RestaurantCard({ merchant }) {
  const rating = Number(merchant.avg_rating) || 0;
  const reviews = Number(merchant.review_count) || 0;
  const prep = Number(merchant.avg_prep_minutes) || 35;
  const cuisines = (merchant.cuisine_types || []).slice(0, 2).join(' · ') || 'Restaurant';
  const newHere = isNewMerchant(merchant.created_at);
  const fast = isFastDelivery(merchant);
  const top = rating >= 4.8;

  return (
    <Link
      href={`/restaurants/${merchant.slug}`}
      className="restaurant-card"
    >
      <div className="restaurant-card-banner">
        {merchant.banner_url ? (
          <img
            src={merchant.banner_url}
            alt=""
            className="restaurant-card-banner-img"
            loading="lazy"
          />
        ) : (
          <div className="restaurant-card-banner-placeholder" aria-hidden />
        )}
        <div className="restaurant-card-banner-overlay">
          <span
            className={`restaurant-status ${merchant.isOpen ? 'open' : 'closed'}`}
          >
            {merchant.isOpen
              ? `Open · ~${prep} min`
              : 'Closed'}
          </span>
        </div>
      </div>
      <div className="restaurant-card-body">
        <div className="restaurant-card-head">
          {merchant.logo_url ? (
            <img
              src={merchant.logo_url}
              alt=""
              className="restaurant-card-logo"
              loading="lazy"
            />
          ) : (
            <div className="restaurant-card-logo-placeholder">
              {merchant.business_name?.charAt(0) ?? '?'}
            </div>
          )}
          <div className="restaurant-card-title-block">
            <h3 className="restaurant-card-name">{merchant.business_name}</h3>
            <p className="restaurant-card-meta-line">
              {cuisines} · {priceRangeLabel(merchant.price_range)}
            </p>
            <p className="restaurant-card-meta-line">
              <span className="restaurant-card-rating">
                ★ {rating.toFixed(1)}
              </span>
              <span className="restaurant-card-muted">
                ({reviews}) · {formatDistanceKm(merchant.distanceKm)} away
              </span>
            </p>
            <p className="restaurant-card-meta-line restaurant-card-muted">
              Min order {fmtNgn(merchant.min_order_amount)} · Delivery{' '}
              {fmtNgn(DEFAULT_DELIVERY_FEE_NGN)}
            </p>
          </div>
        </div>
        <div className="restaurant-card-badges">
          {merchant.is_featured && (
            <span className="badge badge-gold">Featured</span>
          )}
          {newHere && <span className="badge badge-new">New</span>}
          {fast && <span className="badge badge-fast">Fast</span>}
          {top && <span className="badge badge-top">Top rated</span>}
        </div>
      </div>
    </Link>
  );
}
