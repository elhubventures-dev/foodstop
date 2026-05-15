# Reference 01 — Database Schema & Commission Engine

## Full DDL — New Tables

```sql
-- ============================================================
-- MERCHANTS
-- ============================================================
CREATE TABLE merchants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  business_name       VARCHAR(200) NOT NULL,
  slug                VARCHAR(200) UNIQUE NOT NULL,  -- URL-safe name
  business_email      VARCHAR(200) UNIQUE NOT NULL,
  business_phone      VARCHAR(20) NOT NULL,
  business_address    TEXT,
  city                VARCHAR(100),
  state               VARCHAR(100),   -- Nigerian state
  logo_url            TEXT,
  banner_url          TEXT,
  description         TEXT,
  tagline             VARCHAR(300),
  cuisine_types       TEXT[],         -- e.g. ['Nigerian', 'Chinese']
  category            VARCHAR(100),   -- Fast Food, Fine Dining, Cloud Kitchen, etc.
  price_range         SMALLINT DEFAULT 2 CHECK (price_range BETWEEN 1 AND 4),
  avg_prep_minutes    SMALLINT DEFAULT 30,
  min_order_amount    NUMERIC(12,2) DEFAULT 0,
  opening_hours       JSONB,          -- { mon: {open:'08:00', close:'22:00'}, ... }
  delivery_radius_km  NUMERIC(5,2) DEFAULT 5,
  uses_own_riders     BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT FALSE,   -- set true on admin approval
  is_verified         BOOLEAN DEFAULT FALSE,
  is_featured         BOOLEAN DEFAULT FALSE,
  is_suspended        BOOLEAN DEFAULT FALSE,
  suspension_reason   TEXT,
  is_pickup_enabled   BOOLEAN DEFAULT TRUE,
  is_dinein_enabled   BOOLEAN DEFAULT FALSE,
  commission_rate     NUMERIC(5,4) DEFAULT 0.15,  -- 15% default, overridable
  total_orders        INTEGER DEFAULT 0,
  avg_rating          NUMERIC(3,2) DEFAULT 0,
  review_count        INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_merchants_city ON merchants(city);
CREATE INDEX idx_merchants_is_active ON merchants(is_active);
CREATE INDEX idx_merchants_is_featured ON merchants(is_featured);
CREATE INDEX idx_merchants_slug ON merchants(slug);

-- ============================================================
-- MERCHANT KYC DOCUMENTS
-- ============================================================
CREATE TABLE merchant_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  doc_type        VARCHAR(50) NOT NULL CHECK (doc_type IN (
                    'CAC', 'BVN', 'NIN', 'FSSAI', 'bank_statement',
                    'owner_id', 'utility_bill', 'other'
                  )),
  doc_url         TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                    'pending', 'approved', 'rejected'
                  )),
  reviewer_id     UUID REFERENCES users(id),
  reviewer_note   TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_merchant_docs_merchant ON merchant_documents(merchant_id);
CREATE INDEX idx_merchant_docs_status ON merchant_documents(status);

-- ============================================================
-- MERCHANT WALLETS (one per merchant)
-- ============================================================
CREATE TABLE merchant_wallets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id           UUID UNIQUE NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  available_balance     NUMERIC(15,2) DEFAULT 0.00,  -- withdrawable now
  pending_balance       NUMERIC(15,2) DEFAULT 0.00,  -- held, not yet released
  total_earned          NUMERIC(15,2) DEFAULT 0.00,  -- lifetime credits
  total_withdrawn       NUMERIC(15,2) DEFAULT 0.00,  -- lifetime withdrawals
  total_commission_paid NUMERIC(15,2) DEFAULT 0.00,  -- lifetime commission paid to platform
  currency              CHAR(3) DEFAULT 'NGN',
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MERCHANT WALLET TRANSACTIONS (immutable ledger)
-- ============================================================
CREATE TABLE merchant_wallet_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       UUID NOT NULL REFERENCES merchants(id),
  type              VARCHAR(30) NOT NULL CHECK (type IN (
                      'credit', 'debit', 'commission', 'withdrawal',
                      'refund_deduction', 'manual_credit', 'manual_debit',
                      'promo_top_up', 'dispute_hold', 'dispute_release'
                    )),
  amount            NUMERIC(12,2) NOT NULL,  -- gross
  commission_amount NUMERIC(12,2) DEFAULT 0,
  net_amount        NUMERIC(12,2) NOT NULL,  -- after commission
  reference         VARCHAR(100) UNIQUE,
  order_id          UUID REFERENCES orders(id),
  withdrawal_id     UUID,                   -- FK added after withdrawal table
  description       TEXT,
  status            VARCHAR(20) DEFAULT 'completed' CHECK (status IN (
                      'pending', 'completed', 'failed', 'reversed'
                    )),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_wallet_tx_merchant ON merchant_wallet_transactions(merchant_id);
CREATE INDEX idx_wallet_tx_type ON merchant_wallet_transactions(type);
CREATE INDEX idx_wallet_tx_order ON merchant_wallet_transactions(order_id);
CREATE INDEX idx_wallet_tx_created ON merchant_wallet_transactions(created_at DESC);

-- ============================================================
-- MERCHANT WITHDRAWALS
-- ============================================================
CREATE TABLE merchant_withdrawals (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id               UUID NOT NULL REFERENCES merchants(id),
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
  admin_approved            BOOLEAN DEFAULT FALSE,  -- for amounts > threshold
  admin_id                  UUID REFERENCES users(id)
);
CREATE INDEX idx_withdrawals_merchant ON merchant_withdrawals(merchant_id);
CREATE INDEX idx_withdrawals_status ON merchant_withdrawals(status);

-- ============================================================
-- MERCHANT BANK ACCOUNTS (saved)
-- ============================================================
CREATE TABLE merchant_bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  bank_name       VARCHAR(100) NOT NULL,
  bank_code       VARCHAR(10) NOT NULL,
  account_number  VARCHAR(10) NOT NULL,
  account_name    VARCHAR(200) NOT NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  is_verified     BOOLEAN DEFAULT FALSE,  -- verified via Paystack resolve
  paystack_recipient_code VARCHAR(100),   -- cached after first payout
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, account_number)
);

-- ============================================================
-- PLATFORM COMMISSION LEDGER (immutable)
-- ============================================================
CREATE TABLE platform_commission_ledger (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id),
  merchant_id       UUID NOT NULL REFERENCES merchants(id),
  order_grand_total NUMERIC(12,2),
  food_subtotal     NUMERIC(12,2) NOT NULL,  -- basis for commission
  commission_rate   NUMERIC(5,4) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  vat_amount        NUMERIC(12,2) DEFAULT 0, -- 7.5% NGN VAT
  merchant_net      NUMERIC(12,2) NOT NULL,
  released_at       TIMESTAMPTZ,             -- when pending → available
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_commission_merchant ON platform_commission_ledger(merchant_id);
CREATE INDEX idx_commission_order ON platform_commission_ledger(order_id);
CREATE INDEX idx_commission_created ON platform_commission_ledger(created_at DESC);

-- ============================================================
-- MERCHANT REVIEWS
-- ============================================================
CREATE TABLE merchant_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id   UUID NOT NULL REFERENCES merchants(id),
  customer_id   UUID NOT NULL REFERENCES users(id),
  order_id      UUID NOT NULL REFERENCES orders(id),
  food_rating   SMALLINT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
  service_rating SMALLINT CHECK (service_rating BETWEEN 1 AND 5),
  review_text   TEXT,
  reply_text    TEXT,
  reply_at      TIMESTAMPTZ,
  photos        TEXT[],
  is_flagged    BOOLEAN DEFAULT FALSE,
  flag_reason   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, customer_id)
);
CREATE INDEX idx_reviews_merchant ON merchant_reviews(merchant_id);

-- ============================================================
-- MERCHANT PROMOTIONS (merchant-owned)
-- ============================================================
CREATE TABLE merchant_promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id),
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

-- ============================================================
-- MERCHANT NOTIFICATIONS
-- ============================================================
CREATE TABLE merchant_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(200),
  body        TEXT,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_merchant_notif ON merchant_notifications(merchant_id, is_read);

-- ============================================================
-- MERCHANT TEAM MEMBERS
-- ============================================================
CREATE TABLE merchant_team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  user_id     UUID REFERENCES users(id),
  email       VARCHAR(200) NOT NULL,
  role        VARCHAR(20) CHECK (role IN ('manager', 'kitchen', 'cashier')),
  status      VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'deactivated')),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  joined_at   TIMESTAMPTZ,
  UNIQUE(merchant_id, email)
);

-- ============================================================
-- MERCHANT TIERS
-- ============================================================
CREATE TABLE merchant_tiers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         UUID UNIQUE NOT NULL REFERENCES merchants(id),
  tier                VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  monthly_gmv         NUMERIC(15,2) DEFAULT 0,  -- recalculated monthly
  commission_override NUMERIC(5,4),             -- NULL = use tier default
  last_evaluated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Tier thresholds and commission benefits:
-- Bronze:   ₦0     - ₦499,999/mo  → 15% commission
-- Silver:   ₦500k  - ₦1.99M/mo   → 13% commission
-- Gold:     ₦2M    - ₦9.99M/mo   → 11% commission
-- Platinum: ₦10M+  /mo            → 9%  commission

-- ============================================================
-- FEATURED MERCHANT SLOTS
-- ============================================================
CREATE TABLE merchant_featured_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id),
  slot_type       VARCHAR(30) CHECK (slot_type IN ('homepage_hero', 'category_top', 'search_top')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  amount_paid     NUMERIC(10,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),  -- super admin
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLATFORM FLASH SALES
-- ============================================================
CREATE TABLE platform_flash_sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200),
  discount_type     VARCHAR(20) CHECK (discount_type IN ('free_delivery', 'percent', 'fixed')),
  discount_value    NUMERIC(10,2),
  applies_to        VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'selected_merchants')),
  merchant_ids      UUID[],         -- NULL = all merchants
  start_at          TIMESTAMPTZ,
  end_at            TIMESTAMPTZ,
  budget_cap        NUMERIC(12,2),  -- max platform absorbs
  amount_used       NUMERIC(12,2) DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISPUTE CASES
-- ============================================================
CREATE TABLE dispute_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  merchant_id     UUID NOT NULL REFERENCES merchants(id),
  customer_id     UUID NOT NULL REFERENCES users(id),
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
  resolved_by     UUID REFERENCES users(id),
  opened_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- ============================================================
-- FRAUD FLAGS
-- ============================================================
CREATE TABLE fraud_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES orders(id),
  merchant_id   UUID REFERENCES merchants(id),
  customer_id   UUID REFERENCES users(id),
  flag_type     VARCHAR(50) CHECK (flag_type IN (
                  'high_value_cod', 'velocity_abuse', 'address_anomaly',
                  'bulk_cash_orders', 'repeated_refunds', 'suspicious_merchant'
                )),
  description   TEXT,
  severity      VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status        VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed','actioned')),
  reviewed_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MERCHANT INVOICES (auto-generated monthly)
-- ============================================================
CREATE TABLE merchant_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id),
  invoice_number  VARCHAR(50) UNIQUE,   -- e.g. INV-2025-06-0042
  period_start    DATE,
  period_end      DATE,
  total_orders    INTEGER,
  gross_revenue   NUMERIC(15,2),
  commission_paid NUMERIC(15,2),
  vat_collected   NUMERIC(15,2),
  net_earnings    NUMERIC(15,2),
  total_withdrawn NUMERIC(15,2),
  closing_balance NUMERIC(15,2),
  pdf_url         TEXT,
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_invoices_merchant ON merchant_invoices(merchant_id);

-- ============================================================
-- MERCHANT REFERRALS
-- ============================================================
CREATE TABLE merchant_referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES merchants(id),
  referred_email  VARCHAR(200),
  referred_merchant_id UUID REFERENCES merchants(id),
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                    'pending', 'registered', 'approved', 'rewarded'
                  )),
  reward_type     VARCHAR(20) DEFAULT 'wallet_credit',
  reward_amount   NUMERIC(10,2) DEFAULT 5000.00,  -- ₦5,000 default
  rewarded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXISTING TABLE ALTERATIONS
-- ============================================================
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id);
ALTER TABLE menu_items      ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id);
ALTER TABLE orders          ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id);
ALTER TABLE order_items     ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id);
ALTER TABLE menu_items      ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;  -- NULL = unlimited
ALTER TABLE menu_items      ADD COLUMN IF NOT EXISTS auto_soldout BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_menu_categories_merchant ON menu_categories(merchant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_merchant ON menu_items(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);

-- ============================================================
-- SEED: Convert original restaurant to Merchant ID = 1
-- ============================================================
-- Run this migration ONCE on existing database:
-- INSERT INTO merchants (id, business_name, is_active, is_verified, commission_rate, ...)
--   VALUES ('00000000-0000-0000-0000-000000000001', 'ChopFast Kitchen', true, true, 0.15, ...);
-- UPDATE menu_categories SET merchant_id = '00000000-...' WHERE merchant_id IS NULL;
-- UPDATE menu_items      SET merchant_id = '00000000-...' WHERE merchant_id IS NULL;
-- UPDATE orders          SET merchant_id = '00000000-...' WHERE merchant_id IS NULL;
```

## Commission Engine — Full Implementation Notes

### What commission is charged on
- ✅ Food subtotal (sum of item prices × quantities)
- ❌ NOT delivery fee (goes to rider pool)
- ❌ NOT VAT (collected by platform, remitted to FIRS)
- ❌ NOT merchant-funded promo discounts (commission on pre-discount price)

### Cancellation commission policy (configurable in super admin)
- Cancelled before merchant accepts: 0% commission
- Cancelled after merchant accepts but before prep: 5% commission
- Cancelled after prep started: 10% commission
- Store as `platform_settings.cancellation_commission_policy` (JSONB)

### Pending hold duration
- Default: 2 hours from delivery confirmation
- Extended to 24 hours if a dispute_case is opened
- Configurable in `platform_settings.pending_hold_hours`
- Implemented as a background job (BullMQ or pg-boss)

### Job: release-pending-balance
```typescript
// Job handler
async function releasePendingBalance({ merchantId, orderId, amount }) {
  // Check if dispute exists for this order
  const dispute = await db('dispute_cases')
    .where({ order_id: orderId, status: 'open' })
    .first();

  if (dispute) {
    // Extend hold — job will be re-queued by dispute resolution
    return { held: true, reason: 'dispute_open' };
  }

  await db.transaction(async (trx) => {
    await trx('merchant_wallets')
      .where({ merchant_id: merchantId })
      .decrement('pending_balance', amount)
      .increment('available_balance', amount);

    await trx('merchant_wallet_transactions')
      .where({ order_id: orderId, type: 'credit', status: 'pending' })
      .update({ status: 'completed' });

    await trx('platform_commission_ledger')
      .where({ order_id: orderId })
      .update({ released_at: new Date() });
  });
}
```

## VAT Remittance Module

- VAT rate: 7.5% on food subtotal (Nigerian FIRS standard)
- VAT collected by platform on behalf of all merchants
- VAT amounts logged per order in `platform_commission_ledger.vat_amount`
- Monthly VAT summary exported as FIRS-compliant report (CSV + PDF)
- Report fields: merchant name, TIN (if provided), period, taxable supply, VAT collected
- Super admin triggers report from Admin → Financials → VAT Reports
- Report generation: server-side PDF with pdfkit or Puppeteer

## Monthly Invoice Generation (Cron Job)

Runs 1st of every month at 00:05 WAT:
```
For each active merchant:
  1. Aggregate orders for prior month from platform_commission_ledger
  2. Calculate: total_orders, gross_revenue, commission_paid, vat_collected, net_earnings, total_withdrawn, closing_balance
  3. Generate PDF (logo, merchant name, period, line items, totals)
  4. Upload PDF to Cloudinary
  5. Insert into merchant_invoices
  6. Email PDF to merchant business_email
  7. Create merchant_notification (type: 'monthly_invoice')
```
