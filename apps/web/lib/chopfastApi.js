/**
 * Base URL for the ChopFast Nest API (no trailing slash).
 * Example: https://api.example.com  → requests use `${getChopfastApiBaseUrl()}/api/v1/...`
 *
 * In development, defaults to the local Nest app (same as @chopfast/admin merchantApi).
 * Set NEXT_PUBLIC_CHOPFAST_API_URL for deployed / preview environments.
 */
export function getChopfastApiBaseUrl() {
  const fallback =
    process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '';
  const raw = process.env.NEXT_PUBLIC_CHOPFAST_API_URL ?? fallback;
  return String(raw).replace(/\/+$/, '');
}
