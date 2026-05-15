-- Phase 8 — Growth & safety: platform-wide feature gates + rating enforcement hook
-- Skill checklist keys (UI/API can branch on platform_feature_flags.enabled).

CREATE TABLE IF NOT EXISTS public.platform_feature_flags (
  flag_key    TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  label       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id)
);

INSERT INTO public.platform_feature_flags (flag_key, enabled, label, description) VALUES
  ('vat_remittance', FALSE, 'VAT remittance module', 'Extended VAT workflows beyond CSV export.'),
  ('merchant_invoice_pdf', FALSE, 'Monthly merchant invoice PDF', 'Auto-generated merchant statements (PDF).'),
  ('escrow_dispute_extension', FALSE, 'Escrow + dispute extension', 'Hold pending balance when dispute_case is open.'),
  ('merchant_tiers_badges', FALSE, 'Merchant tiers & badges', 'Bronze–Platinum tier display and GMV-based evaluation.'),
  ('merchant_referrals', FALSE, 'Merchant referral program', 'Referral links, rewards, merchant_referrals tracking.'),
  ('paid_featured_placement', FALSE, 'Paid featured placement', 'Merchant booking + merchant_featured_slots enforcement on storefront.'),
  ('platform_flash_sales', FALSE, 'Platform flash sales', 'Homepage / customer banners from platform_flash_sales.'),
  ('rating_auto_suspension', FALSE, 'Rating auto-suspension', 'Daily enforcement: sustained low avg_rating suspends merchant.'),
  ('customer_disputes', FALSE, 'Customer dispute + refund workflow', 'Dispute cases UI and merchant response flows.'),
  ('anti_fraud_flags', FALSE, 'Anti-fraud flagging', 'fraud_flags queue and velocity/COD rules (incremental).'),
  ('merchant_email_marketing', FALSE, 'Merchant email marketing (NDPR)', 'Opt-in lists + campaign sends (SendGrid etc.).'),
  ('merchant_mobile_companion', FALSE, 'Merchant mobile companion (V1)', 'Lightweight RN app — separate release.'),
  ('multi_location_merchant', FALSE, 'Multi-location per merchant', 'Branches / secondary kitchens under one account.'),
  ('inventory_stock', FALSE, 'Inventory / stock per item', 'menu_items.stock_quantity surfaced in portal + sold-out rules.'),
  ('merchant_support_chat', FALSE, 'Merchant ↔ platform support chat', 'In-app chat channel with ops.')
ON CONFLICT (flag_key) DO NOTHING;

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS low_rating_since DATE;

COMMENT ON COLUMN public.merchants.low_rating_since IS
  'Phase 8: date avg_rating first fell below suspend threshold; cleared when rating recovers. Used with rating_auto_suspension flag.';

CREATE OR REPLACE FUNCTION public.touch_platform_feature_flags_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_feature_flags_updated ON public.platform_feature_flags;
CREATE TRIGGER trg_platform_feature_flags_updated
  BEFORE UPDATE ON public.platform_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_platform_feature_flags_updated();

ALTER TABLE public.platform_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_feature_flags_select_all" ON public.platform_feature_flags;
CREATE POLICY "platform_feature_flags_select_all"
  ON public.platform_feature_flags FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "platform_feature_flags_update_staff" ON public.platform_feature_flags;
CREATE POLICY "platform_feature_flags_update_staff"
  ON public.platform_feature_flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  );

-- Nightly-style job (invoke from Super Admin or pg_cron). Respects rating_auto_suspension flag.
CREATE OR REPLACE FUNCTION public.run_merchant_rating_enforcement(
  p_suspend_below NUMERIC DEFAULT 2.5,
  p_min_reviews INT DEFAULT 10,
  p_sustain_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_on BOOLEAN;
  n_start INT := 0;
  n_clear INT := 0;
  n_suspend INT := 0;
BEGIN
  SELECT enabled INTO v_on
  FROM public.platform_feature_flags
  WHERE flag_key = 'rating_auto_suspension';

  IF NOT COALESCE(v_on, FALSE) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'rating_auto_suspension_disabled');
  END IF;

  UPDATE public.merchants m
  SET low_rating_since = NULL
  WHERE m.low_rating_since IS NOT NULL
    AND (
      m.avg_rating IS NULL
      OR m.avg_rating >= p_suspend_below
      OR m.review_count < p_min_reviews
    );
  GET DIAGNOSTICS n_clear = ROW_COUNT;

  UPDATE public.merchants m
  SET low_rating_since = CURRENT_DATE
  WHERE m.is_active = TRUE
    AND m.is_suspended = FALSE
    AND m.review_count >= p_min_reviews
    AND m.avg_rating IS NOT NULL
    AND m.avg_rating < p_suspend_below
    AND m.low_rating_since IS NULL;
  GET DIAGNOSTICS n_start = ROW_COUNT;

  UPDATE public.merchants m
  SET
    is_active = FALSE,
    is_suspended = TRUE,
    suspension_reason = CASE
      WHEN m.suspension_reason IS NULL OR btrim(m.suspension_reason) = '' THEN
        'Auto-suspended: average rating below ' || p_suspend_below::TEXT ||
        ' for ' || p_sustain_days::TEXT || '+ days (Phase 8).'
      ELSE
        m.suspension_reason || E'\n' ||
        'Auto-suspended: average rating below ' || p_suspend_below::TEXT ||
        ' for ' || p_sustain_days::TEXT || '+ days (Phase 8).'
    END
  WHERE m.low_rating_since IS NOT NULL
    AND m.low_rating_since <= (CURRENT_DATE - p_sustain_days)
    AND m.is_suspended = FALSE;
  GET DIAGNOSTICS n_suspend = ROW_COUNT;

  RETURN jsonb_build_object(
    'streaks_started', n_start,
    'streaks_cleared', n_clear,
    'merchants_suspended', n_suspend
  );
END;
$$;

COMMENT ON FUNCTION public.run_merchant_rating_enforcement IS
  'Call from ops (Super Admin) or pg_cron when rating_auto_suspension flag is on.';

GRANT EXECUTE ON FUNCTION public.run_merchant_rating_enforcement(NUMERIC, INT, INT) TO service_role;
