-- =============================================================================
-- ChopFast Multi-Vendor Marketplace — Phase 1 foundation migration
-- Source: chopfast-multivendor-skill (references/01-database-commission.md)
--
-- Existing ChopFast schema alignment:
--   - profiles (not users) — FK targets use profiles(id)
--   - categories (not menu_categories)
--
-- Anchor merchant "id = 1": UUID 00000000-0000-0000-0000-000000000001
-- (canonical first merchant; stable URL/API identifier).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. MERCHANTS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_name       VARCHAR(200) NOT NULL,
  slug                VARCHAR(200) UNIQUE NOT NULL,
  business_email      VARCHAR(200) UNIQUE NOT NULL,
  business_phone      VARCHAR(20) NOT NULL,
  business_address    TEXT,
  city                VARCHAR(100),
  state               VARCHAR(100),
  logo_url            TEXT,
  banner_url          TEXT,
  description         TEXT,
  tagline             VARCHAR(300),
  cuisine_types       TEXT[],
  category            VARCHAR(100),
  price_range         SMALLINT DEFAULT 2 CHECK (price_range BETWEEN 1 AND 4),
  avg_prep_minutes    SMALLINT DEFAULT 30,
  min_order_amount    NUMERIC(12,2) DEFAULT 0,
  opening_hours       JSONB,
  delivery_radius_km  NUMERIC(5,2) DEFAULT 5,
  uses_own_riders     BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT FALSE,
  is_verified         BOOLEAN DEFAULT FALSE,
  is_featured         BOOLEAN DEFAULT FALSE,
  is_suspended        BOOLEAN DEFAULT FALSE,
  suspension_reason   TEXT,
  is_pickup_enabled   BOOLEAN DEFAULT TRUE,
  is_dinein_enabled   BOOLEAN DEFAULT FALSE,
  commission_rate     NUMERIC(5,4) DEFAULT 0.15,
  total_orders        INTEGER DEFAULT 0,
  avg_rating          NUMERIC(3,2) DEFAULT 0,
  review_count        INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchants_city ON public.merchants(city);
CREATE INDEX idx_merchants_is_active ON public.merchants(is_active);
CREATE INDEX idx_merchants_is_featured ON public.merchants(is_featured);
CREATE INDEX idx_merchants_slug ON public.merchants(slug);

-- -----------------------------------------------------------------------------
-- 2. MERCHANT KYC DOCUMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  doc_type        VARCHAR(50) NOT NULL CHECK (doc_type IN (
                    'CAC', 'BVN', 'NIN', 'FSSAI', 'bank_statement',
                    'owner_id', 'utility_bill', 'other'
                  )),
  doc_url         TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                    'pending', 'approved', 'rejected'
                  )),
  reviewer_id     UUID REFERENCES public.profiles(id),
  reviewer_note   TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchant_docs_merchant ON public.merchant_documents(merchant_id);
CREATE INDEX idx_merchant_docs_status ON public.merchant_documents(status);

-- -----------------------------------------------------------------------------
-- 3. MERCHANT WALLETS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_wallets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id           UUID UNIQUE NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  available_balance     NUMERIC(15,2) DEFAULT 0.00,
  pending_balance       NUMERIC(15,2) DEFAULT 0.00,
  total_earned          NUMERIC(15,2) DEFAULT 0.00,
  total_withdrawn       NUMERIC(15,2) DEFAULT 0.00,
  total_commission_paid NUMERIC(15,2) DEFAULT 0.00,
  currency              CHAR(3) DEFAULT 'NGN',
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. MERCHANT BANK ACCOUNTS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_bank_accounts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id             UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  bank_name               VARCHAR(100) NOT NULL,
  bank_code               VARCHAR(10) NOT NULL,
  account_number          VARCHAR(10) NOT NULL,
  account_name            VARCHAR(200) NOT NULL,
  is_default              BOOLEAN DEFAULT FALSE,
  is_verified             BOOLEAN DEFAULT FALSE,
  paystack_recipient_code VARCHAR(100),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, account_number)
);

-- -----------------------------------------------------------------------------
-- 5. MERCHANT WITHDRAWALS (before wallet tx FK)
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_withdrawals (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id               UUID NOT NULL REFERENCES public.merchants(id),
  amount                    NUMERIC(12,2) NOT NULL,
  bank_name                 VARCHAR(100) NOT NULL,
  bank_code                 VARCHAR(10) NOT NULL,
  account_number            VARCHAR(10) NOT NULL,
  account_name              VARCHAR(200) NOT NULL,
  paystack_recipient_code   VARCHAR(100),
  paystack_transfer_code    VARCHAR(100),
  paystack_transfer_ref     VARCHAR(100),
  status                    VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                              'pending', 'processing', 'completed', 'failed', 'reversed'
                            )),
  failure_reason            TEXT,
  initiated_at              TIMESTAMPTZ DEFAULT NOW(),
  processed_at              TIMESTAMPTZ,
  otp_verified              BOOLEAN DEFAULT FALSE,
  admin_approved            BOOLEAN DEFAULT FALSE,
  admin_id                  UUID REFERENCES public.profiles(id)
);

CREATE INDEX idx_withdrawals_merchant ON public.merchant_withdrawals(merchant_id);
CREATE INDEX idx_withdrawals_status ON public.merchant_withdrawals(status);

-- -----------------------------------------------------------------------------
-- 6. MERCHANT WALLET TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_wallet_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       UUID NOT NULL REFERENCES public.merchants(id),
  type              VARCHAR(30) NOT NULL CHECK (type IN (
                      'credit', 'debit', 'commission', 'withdrawal',
                      'refund_deduction', 'manual_credit', 'manual_debit',
                      'promo_top_up', 'dispute_hold', 'dispute_release'
                    )),
  amount            NUMERIC(12,2) NOT NULL,
  commission_amount NUMERIC(12,2) DEFAULT 0,
  net_amount        NUMERIC(12,2) NOT NULL,
  reference         VARCHAR(100) UNIQUE,
  order_id          UUID REFERENCES public.orders(id),
  withdrawal_id     UUID REFERENCES public.merchant_withdrawals(id) ON DELETE SET NULL,
  description       TEXT,
  status            VARCHAR(20) DEFAULT 'completed' CHECK (status IN (
                      'pending', 'completed', 'failed', 'reversed'
                    )),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_merchant ON public.merchant_wallet_transactions(merchant_id);
CREATE INDEX idx_wallet_tx_type ON public.merchant_wallet_transactions(type);
CREATE INDEX idx_wallet_tx_order ON public.merchant_wallet_transactions(order_id);
CREATE INDEX idx_wallet_tx_withdrawal ON public.merchant_wallet_transactions(withdrawal_id);
CREATE INDEX idx_wallet_tx_created ON public.merchant_wallet_transactions(created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. PLATFORM COMMISSION LEDGER
-- -----------------------------------------------------------------------------
CREATE TABLE public.platform_commission_ledger (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders(id),
  merchant_id       UUID NOT NULL REFERENCES public.merchants(id),
  order_grand_total NUMERIC(12,2),
  food_subtotal     NUMERIC(12,2) NOT NULL,
  commission_rate   NUMERIC(5,4) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  vat_amount        NUMERIC(12,2) DEFAULT 0,
  merchant_net      NUMERIC(12,2) NOT NULL,
  released_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commission_merchant ON public.platform_commission_ledger(merchant_id);
CREATE INDEX idx_commission_order ON public.platform_commission_ledger(order_id);
CREATE INDEX idx_commission_created ON public.platform_commission_ledger(created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. MERCHANT REVIEWS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id    UUID NOT NULL REFERENCES public.merchants(id),
  customer_id    UUID NOT NULL REFERENCES public.profiles(id),
  order_id       UUID NOT NULL REFERENCES public.orders(id),
  food_rating    SMALLINT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
  service_rating SMALLINT CHECK (service_rating BETWEEN 1 AND 5),
  review_text    TEXT,
  reply_text     TEXT,
  reply_at       TIMESTAMPTZ,
  photos         TEXT[],
  is_flagged     BOOLEAN DEFAULT FALSE,
  flag_reason    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, customer_id)
);

CREATE INDEX idx_reviews_merchant ON public.merchant_reviews(merchant_id);

-- -----------------------------------------------------------------------------
-- 9. MERCHANT PROMOTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES public.merchants(id),
  code            VARCHAR(50) NOT NULL,
  discount_type   VARCHAR(20) CHECK (discount_type IN ('percent', 'fixed', 'free_delivery')),
  discount_value  NUMERIC(10,2),
  min_order       NUMERIC(10,2) DEFAULT 0,
  max_uses        INTEGER,
  uses_count      INTEGER DEFAULT 0,
  valid_from      TIMESTAMPTZ,
  valid_to        TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, code)
);

-- -----------------------------------------------------------------------------
-- 10. MERCHANT NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(200),
  body        TEXT,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchant_notif ON public.merchant_notifications(merchant_id, is_read);

-- -----------------------------------------------------------------------------
-- 11. MERCHANT TEAM MEMBERS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  user_id     UUID REFERENCES public.profiles(id),
  email       VARCHAR(200) NOT NULL,
  role        VARCHAR(20) CHECK (role IN ('manager', 'kitchen', 'cashier')),
  status      VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'deactivated')),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  joined_at   TIMESTAMPTZ,
  UNIQUE(merchant_id, email)
);

-- -----------------------------------------------------------------------------
-- 12. MERCHANT TIERS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_tiers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         UUID UNIQUE NOT NULL REFERENCES public.merchants(id),
  tier                VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  monthly_gmv         NUMERIC(15,2) DEFAULT 0,
  commission_override NUMERIC(5,4),
  last_evaluated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 13. MERCHANT TIER HISTORY (skill checklist)
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_tier_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id   UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  from_tier     VARCHAR(20),
  to_tier       VARCHAR(20) NOT NULL,
  reason        TEXT,
  evaluated_gmv NUMERIC(15,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tier_history_merchant ON public.merchant_tier_history(merchant_id);

-- -----------------------------------------------------------------------------
-- 14. FEATURED MERCHANT SLOTS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_featured_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  slot_type   VARCHAR(30) CHECK (slot_type IN ('homepage_hero', 'category_top', 'search_top')),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 15. PLATFORM FLASH SALES
-- -----------------------------------------------------------------------------
CREATE TABLE public.platform_flash_sales (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(200),
  discount_type  VARCHAR(20) CHECK (discount_type IN ('free_delivery', 'percent', 'fixed')),
  discount_value NUMERIC(10,2),
  applies_to     VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'selected_merchants')),
  merchant_ids   UUID[],
  start_at       TIMESTAMPTZ,
  end_at         TIMESTAMPTZ,
  budget_cap     NUMERIC(12,2),
  amount_used    NUMERIC(12,2) DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  created_by     UUID REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 16. DISPUTE CASES
-- -----------------------------------------------------------------------------
CREATE TABLE public.dispute_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id),
  merchant_id     UUID NOT NULL REFERENCES public.merchants(id),
  customer_id     UUID NOT NULL REFERENCES public.profiles(id),
  reason          VARCHAR(50) CHECK (reason IN (
                    'wrong_item', 'missing_item', 'poor_quality',
                    'not_delivered', 'overcharged', 'other'
                  )),
  description     TEXT,
  evidence_urls   TEXT[],
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN (
                    'open', 'investigating', 'resolved_refund',
                    'resolved_no_refund', 'closed'
                  )),
  resolution_note TEXT,
  refund_amount   NUMERIC(12,2),
  resolved_by     UUID REFERENCES public.profiles(id),
  opened_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 17. FRAUD FLAGS
-- -----------------------------------------------------------------------------
CREATE TABLE public.fraud_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES public.orders(id),
  merchant_id UUID REFERENCES public.merchants(id),
  customer_id UUID REFERENCES public.profiles(id),
  flag_type   VARCHAR(50) CHECK (flag_type IN (
                'high_value_cod', 'velocity_abuse', 'address_anomaly',
                'bulk_cash_orders', 'repeated_refunds', 'suspicious_merchant'
              )),
  description TEXT,
  severity    VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status      VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed','actioned')),
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 18. MERCHANT INVOICES
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       UUID NOT NULL REFERENCES public.merchants(id),
  invoice_number    VARCHAR(50) UNIQUE,
  period_start      DATE,
  period_end        DATE,
  total_orders      INTEGER,
  gross_revenue     NUMERIC(15,2),
  commission_paid   NUMERIC(15,2),
  vat_collected     NUMERIC(15,2),
  net_earnings      NUMERIC(15,2),
  total_withdrawn   NUMERIC(15,2),
  closing_balance   NUMERIC(15,2),
  pdf_url           TEXT,
  generated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_merchant ON public.merchant_invoices(merchant_id);

-- -----------------------------------------------------------------------------
-- 19. MERCHANT REFERRALS
-- -----------------------------------------------------------------------------
CREATE TABLE public.merchant_referrals (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id            UUID NOT NULL REFERENCES public.merchants(id),
  referred_email         VARCHAR(200),
  referred_merchant_id   UUID REFERENCES public.merchants(id),
  status                 VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                           'pending', 'registered', 'approved', 'rewarded'
                         )),
  reward_type            VARCHAR(20) DEFAULT 'wallet_credit',
  reward_amount          NUMERIC(10,2) DEFAULT 5000.00,
  rewarded_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 20. EXISTING TABLE ALTERATIONS (tenant isolation)
-- -----------------------------------------------------------------------------
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id);

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id);

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS auto_soldout BOOLEAN DEFAULT TRUE;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id);

CREATE INDEX IF NOT EXISTS idx_categories_merchant ON public.categories(merchant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_merchant ON public.menu_items(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_merchant ON public.order_items(merchant_id);

-- -----------------------------------------------------------------------------
-- 21. updated_at on merchants
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_merchants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merchants_updated_at ON public.merchants;
CREATE TRIGGER trg_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_merchants_updated_at();

-- =============================================================================
-- SEED: Anchor merchant (merchant_id = 1)
-- UUID 00000000-0000-0000-0000-000000000001 — original single-restaurant tenant
-- =============================================================================

DO $$
DECLARE
  anchor_id   CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
  v_email     TEXT;
  v_phone     TEXT;
  v_address   TEXT;
  v_hours     JSONB;
  v_radius    NUMERIC(5,2);
BEGIN
  v_email   := 'hello@foodstop.com.ng';
  v_phone   := '+2349133449270';
  v_address := '12 Wuse 2 Road, Abuja';

  SELECT
    COALESCE(value->>'email', v_email),
    COALESCE(value->>'phone', v_phone),
    COALESCE(value->>'address', v_address)
  INTO v_email, v_phone, v_address
  FROM public.store_settings
  WHERE key = 'store_info'
  LIMIT 1;

  IF v_email IS NULL THEN
    v_email   := 'hello@foodstop.com.ng';
    v_phone   := '+2349133449270';
    v_address := '12 Wuse 2 Road, Abuja';
  END IF;

  SELECT value INTO v_hours
  FROM public.store_settings
  WHERE key = 'operating_hours'
  LIMIT 1;

  SELECT NULLIF((value->>'max_radius_km')::NUMERIC, 0)
  INTO v_radius
  FROM public.store_settings
  WHERE key = 'delivery_settings'
  LIMIT 1;

  IF v_radius IS NULL THEN
    v_radius := 15;
  END IF;

  INSERT INTO public.merchants (
    id,
    business_name,
    slug,
    business_email,
    business_phone,
    business_address,
    city,
    state,
    description,
    opening_hours,
    delivery_radius_km,
    is_active,
    is_verified,
    is_featured,
    commission_rate
  ) VALUES (
    anchor_id,
    'Food Stop',
    'food-stop',
    v_email,
    v_phone,
    v_address,
    'Abuja',
    'FCT',
    'Original Food Stop restaurant — anchor marketplace merchant.',
    v_hours,
    v_radius,
    TRUE,
    TRUE,
    TRUE,
    0.15
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name   = 'Food Stop',
    business_email  = EXCLUDED.business_email,
    business_phone  = EXCLUDED.business_phone,
    business_address = EXCLUDED.business_address,
    opening_hours   = COALESCE(EXCLUDED.opening_hours, public.merchants.opening_hours),
    is_active       = TRUE,
    is_verified     = TRUE,
    updated_at      = NOW();

  INSERT INTO public.merchant_wallets (merchant_id)
  VALUES (anchor_id)
  ON CONFLICT (merchant_id) DO NOTHING;

  INSERT INTO public.merchant_tiers (merchant_id, tier)
  VALUES (anchor_id, 'bronze')
  ON CONFLICT (merchant_id) DO UPDATE SET
    last_evaluated_at = NOW();

  UPDATE public.categories
  SET merchant_id = anchor_id
  WHERE merchant_id IS NULL;

  UPDATE public.menu_items
  SET merchant_id = anchor_id
  WHERE merchant_id IS NULL;

  UPDATE public.orders
  SET merchant_id = anchor_id
  WHERE merchant_id IS NULL;

  UPDATE public.order_items oi
  SET merchant_id = o.merchant_id
  FROM public.orders o
  WHERE oi.order_id = o.id
    AND oi.merchant_id IS NULL
    AND o.merchant_id IS NOT NULL;
END $$;

-- Optional (uncomment after validating no orphaned rows):
-- ALTER TABLE public.categories   ALTER COLUMN merchant_id SET NOT NULL;
-- ALTER TABLE public.menu_items    ALTER COLUMN merchant_id SET NOT NULL;
-- ALTER TABLE public.orders        ALTER COLUMN merchant_id SET NOT NULL;
-- ALTER TABLE public.order_items   ALTER COLUMN merchant_id SET NOT NULL;
