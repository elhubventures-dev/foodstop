-- Merchant geo columns for customer discovery (distance from browser geolocation).
-- Abuja centroid ~ 9.0765°N, 7.3986°E — anchor merchant seeded below.

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

COMMENT ON COLUMN public.merchants.latitude IS 'WGS84 latitude for distance calculations';
COMMENT ON COLUMN public.merchants.longitude IS 'WGS84 longitude for distance calculations';

CREATE INDEX IF NOT EXISTS idx_merchants_lat_lng
  ON public.merchants(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Anchor merchant: Abuja (Wuse area) + sample cuisine tags for discovery filters
UPDATE public.merchants
SET
  latitude      = COALESCE(latitude, 9.0765),
  longitude     = COALESCE(longitude, 7.3986),
  cuisine_types = COALESCE(cuisine_types, ARRAY['Nigerian', 'Local']::TEXT[])
WHERE id = '00000000-0000-0000-0000-000000000001';
