-- Checkout: validate merchant-scoped promo codes and track redemption on orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS applied_promotion_id UUID REFERENCES public.merchant_promotions(id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

COMMENT ON COLUMN public.orders.applied_promotion_id IS 'merchant_promotions row used at checkout (uses_count bumped via trigger).';
COMMENT ON COLUMN public.orders.coupon_code IS 'Uppercase promo code snapshot for receipts.';

-- -----------------------------------------------------------------------------
-- validate_merchant_promo: server-side pricing for checkout (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_merchant_promo(
  p_merchant_id UUID,
  p_code TEXT,
  p_subtotal NUMERIC,
  p_delivery_fee NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r           public.merchant_promotions%ROWTYPE;
  code_norm   TEXT := upper(trim(both from coalesce(p_code, '')));
  food_d      NUMERIC(12, 2) := 0;
  d_final     NUMERIC(12, 2) := coalesce(p_delivery_fee, 0);
  disc_total  NUMERIC(12, 2) := 0;
  total_amt   NUMERIC(12, 2);
BEGIN
  IF code_norm = '' OR p_merchant_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'missing');
  END IF;

  SELECT * INTO r
  FROM public.merchant_promotions
  WHERE merchant_id = p_merchant_id
    AND upper(trim(both from code)) = code_norm
    AND coalesce(is_active, true) = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF r.valid_from IS NOT NULL AND r.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_started');
  END IF;
  IF r.valid_to IS NOT NULL AND r.valid_to < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  IF r.max_uses IS NOT NULL AND coalesce(r.uses_count, 0) >= r.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'max_uses');
  END IF;
  IF coalesce(r.min_order, 0) > coalesce(p_subtotal, 0) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'min_order', 'min_order', r.min_order);
  END IF;

  IF r.discount_type = 'percent' THEN
    food_d := round(coalesce(p_subtotal, 0) * coalesce(r.discount_value, 0) / 100.0, 2);
    food_d := least(food_d, coalesce(p_subtotal, 0));
  ELSIF r.discount_type = 'fixed' THEN
    food_d := least(greatest(coalesce(r.discount_value, 0), 0), coalesce(p_subtotal, 0));
  ELSIF r.discount_type = 'free_delivery' THEN
    d_final := 0;
  ELSE
    RETURN jsonb_build_object('valid', false, 'reason', 'bad_type');
  END IF;

  disc_total := food_d + (coalesce(p_delivery_fee, 0) - d_final);
  IF disc_total < 0 THEN
    disc_total := 0;
  END IF;

  total_amt := round(coalesce(p_subtotal, 0) + d_final - food_d, 2);

  RETURN jsonb_build_object(
    'valid', true,
    'promotion_id', r.id,
    'code', r.code,
    'discount', disc_total,
    'delivery_fee', d_final,
    'total', total_amt
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_merchant_promo(UUID, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_merchant_promo(UUID, TEXT, NUMERIC, NUMERIC) TO service_role;

-- -----------------------------------------------------------------------------
-- Bump uses_count when an order is created with a promotion applied
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bump_merchant_promotion_use()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.applied_promotion_id IS NOT NULL AND NEW.merchant_id IS NOT NULL THEN
    UPDATE public.merchant_promotions mp
    SET uses_count = coalesce(uses_count, 0) + 1
    WHERE mp.id = NEW.applied_promotion_id
      AND mp.merchant_id = NEW.merchant_id
      AND (mp.max_uses IS NULL OR coalesce(mp.uses_count, 0) < mp.max_uses);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_bump_merchant_promo ON public.orders;
CREATE TRIGGER trg_orders_bump_merchant_promo
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_merchant_promotion_use();
