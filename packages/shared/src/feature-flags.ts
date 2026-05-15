import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Load all platform feature gates (Phase 8). Safe for anon read when RLS allows SELECT.
 */
export async function fetchPlatformFeatureFlags(
  client: Pick<SupabaseClient, 'from'>,
): Promise<Record<string, boolean>> {
  const { data, error } = await client
    .from('platform_feature_flags')
    .select('flag_key, enabled');
  if (error || !data?.length) return {};
  return Object.fromEntries(
    (data as { flag_key: string; enabled: boolean }[]).map((r) => [r.flag_key, !!r.enabled]),
  );
}

export function isFeatureOn(flags: Record<string, boolean>, key: string): boolean {
  return !!flags[key];
}
