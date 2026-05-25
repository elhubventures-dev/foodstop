-- Baseline RLS for sensitive marketplace tables.
-- Service-role API/admin routes continue to bypass RLS for privileged writes.

CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_merchant(p_merchant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = p_merchant_id
      AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchant_team_members mtm
    WHERE mtm.merchant_id = p_merchant_id
      AND mtm.user_id = auth.uid()
      AND mtm.status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_merchant(UUID) TO authenticated;

-- Public catalogue: customers can browse active merchants and menu data.
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchants_public_active_select" ON public.merchants;
CREATE POLICY "merchants_public_active_select"
  ON public.merchants
  FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE AND is_suspended = FALSE);

DROP POLICY IF EXISTS "merchants_owner_or_staff_select" ON public.merchants;
CREATE POLICY "merchants_owner_or_staff_select"
  ON public.merchants
  FOR SELECT
  TO authenticated
  USING (public.is_platform_staff() OR user_id = auth.uid());

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_active_merchant_select" ON public.categories;
CREATE POLICY "categories_public_active_merchant_select"
  ON public.categories
  FOR SELECT
  USING (
    merchant_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = categories.merchant_id
        AND m.is_active = TRUE
        AND m.is_verified = TRUE
        AND m.is_suspended = FALSE
    )
  );

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_items_public_active_merchant_select" ON public.menu_items;
CREATE POLICY "menu_items_public_active_merchant_select"
  ON public.menu_items
  FOR SELECT
  USING (
    merchant_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = menu_items.merchant_id
        AND m.is_active = TRUE
        AND m.is_verified = TRUE
        AND m.is_suspended = FALSE
    )
  );

-- Orders: customers see their own orders; merchant owners/staff see tenant rows.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_customer_merchant_staff_select" ON public.orders;
CREATE POLICY "orders_customer_merchant_staff_select"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.owns_merchant(merchant_id)
    OR public.is_platform_staff()
  );

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_customer_merchant_staff_select" ON public.order_items;
CREATE POLICY "order_items_customer_merchant_staff_select"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    public.owns_merchant(merchant_id)
    OR public.is_platform_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Merchant private / money / KYC tables.
ALTER TABLE public.merchant_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_documents_owner_staff_select" ON public.merchant_documents;
CREATE POLICY "merchant_documents_owner_staff_select"
  ON public.merchant_documents
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_wallets_owner_staff_select" ON public.merchant_wallets;
CREATE POLICY "merchant_wallets_owner_staff_select"
  ON public.merchant_wallets
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_bank_accounts_owner_staff_select" ON public.merchant_bank_accounts;
CREATE POLICY "merchant_bank_accounts_owner_staff_select"
  ON public.merchant_bank_accounts
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_withdrawals_owner_staff_select" ON public.merchant_withdrawals;
CREATE POLICY "merchant_withdrawals_owner_staff_select"
  ON public.merchant_withdrawals
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_wallet_transactions_owner_staff_select" ON public.merchant_wallet_transactions;
CREATE POLICY "merchant_wallet_transactions_owner_staff_select"
  ON public.merchant_wallet_transactions
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.platform_commission_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_commission_ledger_owner_staff_select" ON public.platform_commission_ledger;
CREATE POLICY "platform_commission_ledger_owner_staff_select"
  ON public.platform_commission_ledger
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_invoices_owner_staff_select" ON public.merchant_invoices;
CREATE POLICY "merchant_invoices_owner_staff_select"
  ON public.merchant_invoices
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_promotions_public_active_select" ON public.merchant_promotions;
CREATE POLICY "merchant_promotions_public_active_select"
  ON public.merchant_promotions
  FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "merchant_promotions_owner_staff_select" ON public.merchant_promotions;
CREATE POLICY "merchant_promotions_owner_staff_select"
  ON public.merchant_promotions
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_notifications_owner_staff_select" ON public.merchant_notifications;
CREATE POLICY "merchant_notifications_owner_staff_select"
  ON public.merchant_notifications
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

DROP POLICY IF EXISTS "merchant_notifications_owner_update_read" ON public.merchant_notifications;
CREATE POLICY "merchant_notifications_owner_update_read"
  ON public.merchant_notifications
  FOR UPDATE
  TO authenticated
  USING (public.owns_merchant(merchant_id))
  WITH CHECK (public.owns_merchant(merchant_id));

-- Reviews and disputes.
ALTER TABLE public.merchant_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_reviews_public_select" ON public.merchant_reviews;
CREATE POLICY "merchant_reviews_public_select"
  ON public.merchant_reviews
  FOR SELECT
  USING (is_flagged = FALSE);

DROP POLICY IF EXISTS "merchant_reviews_owner_customer_staff_select" ON public.merchant_reviews;
CREATE POLICY "merchant_reviews_owner_customer_staff_select"
  ON public.merchant_reviews
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR public.owns_merchant(merchant_id)
    OR public.is_platform_staff()
  );

ALTER TABLE public.dispute_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dispute_cases_customer_merchant_staff_select" ON public.dispute_cases;
CREATE POLICY "dispute_cases_customer_merchant_staff_select"
  ON public.dispute_cases
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR public.owns_merchant(merchant_id)
    OR public.is_platform_staff()
  );

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fraud_flags_staff_select" ON public.fraud_flags;
CREATE POLICY "fraud_flags_staff_select"
  ON public.fraud_flags
  FOR SELECT
  TO authenticated
  USING (public.is_platform_staff());

-- Merchant growth/support private tables introduced in later phases.
ALTER TABLE public.merchant_featured_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_featured_slots_owner_staff_select" ON public.merchant_featured_slots;
CREATE POLICY "merchant_featured_slots_owner_staff_select"
  ON public.merchant_featured_slots
  FOR SELECT
  TO authenticated
  USING (public.owns_merchant(merchant_id) OR public.is_platform_staff());

ALTER TABLE public.merchant_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_referrals_owner_staff_select" ON public.merchant_referrals;
CREATE POLICY "merchant_referrals_owner_staff_select"
  ON public.merchant_referrals
  FOR SELECT
  TO authenticated
  USING (
    public.owns_merchant(referrer_id)
    OR public.owns_merchant(referred_merchant_id)
    OR public.is_platform_staff()
  );
