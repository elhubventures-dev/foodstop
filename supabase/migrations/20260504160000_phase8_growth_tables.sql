-- Phase 8 growth & safety: data model backing flags (VAT filing audit, marketing NDPR, multi-location, chat, slot approval).

-- Paid featured: super-approved slots only surface on storefront when flag is on (see web + API).
ALTER TABLE public.merchant_featured_slots
  ADD COLUMN IF NOT EXISTS ops_approved BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.merchant_featured_slots.ops_approved IS
  'FALSE = merchant self-booked pending ops review; TRUE = super-created or approved.';

-- Platform VAT remittance audit (beyond CSV export).
CREATE TABLE IF NOT EXISTS public.platform_vat_remittance_filings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  total_vat_ngn   NUMERIC(15,2) NOT NULL DEFAULT 0,
  ledger_row_count INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  filed_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vat_filings_created ON public.platform_vat_remittance_filings(created_at DESC);

-- Merchant-scoped VAT self-service (optional filings / remittance notes).
CREATE TABLE IF NOT EXISTS public.merchant_vat_remittance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  vat_amount_ngn  NUMERIC(15,2) NOT NULL DEFAULT 0,
  status          VARCHAR(30) NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('recorded', 'remitted', 'adjusted')),
  reference       VARCHAR(200),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_vat_remittance_merchant ON public.merchant_vat_remittance(merchant_id, period_start DESC);

-- Multi-location (branches / kitchens).
CREATE TABLE IF NOT EXISTS public.merchant_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name            VARCHAR(120) NOT NULL,
  address_line    TEXT,
  city            VARCHAR(120),
  state           VARCHAR(80),
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_locations_merchant ON public.merchant_locations(merchant_id);

-- NDPR-style marketing audience (opt-in list per merchant).
CREATE TABLE IF NOT EXISTS public.merchant_marketing_audience (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  email_normalized VARCHAR(200) NOT NULL,
  opted_in        BOOLEAN NOT NULL DEFAULT TRUE,
  source          VARCHAR(40) DEFAULT 'manual',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (merchant_id, email_normalized)
);

CREATE INDEX IF NOT EXISTS idx_merchant_marketing_audience_merchant ON public.merchant_marketing_audience(merchant_id);

CREATE TABLE IF NOT EXISTS public.merchant_marketing_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  subject           VARCHAR(200) NOT NULL,
  body_plain        TEXT NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  weekly_cap_per_recipient SMALLINT NOT NULL DEFAULT 2,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_merchant_marketing_campaigns_merchant ON public.merchant_marketing_campaigns(merchant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.merchant_marketing_sends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES public.merchant_marketing_campaigns(id) ON DELETE CASCADE,
  email_normalized VARCHAR(200) NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_status VARCHAR(40),
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_merchant_marketing_sends_campaign ON public.merchant_marketing_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_merchant_marketing_sends_recipient_week ON public.merchant_marketing_sends(email_normalized, sent_at DESC);

-- Merchant ↔ ops live chat (parallel to ticket system).
CREATE TABLE IF NOT EXISTS public.merchant_support_chat_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merchant_support_chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES public.merchant_support_chat_threads(id) ON DELETE CASCADE,
  author_role     VARCHAR(20) NOT NULL CHECK (author_role IN ('merchant', 'ops')),
  body            TEXT NOT NULL,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_support_chat_messages_thread ON public.merchant_support_chat_messages(thread_id, created_at ASC);

-- Staff-only audit rows (Super financials UI inserts via authenticated session).
ALTER TABLE public.platform_vat_remittance_filings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_vat_filings_staff_select" ON public.platform_vat_remittance_filings;
CREATE POLICY "platform_vat_filings_staff_select"
  ON public.platform_vat_remittance_filings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "platform_vat_filings_staff_insert" ON public.platform_vat_remittance_filings;
CREATE POLICY "platform_vat_filings_staff_insert"
  ON public.platform_vat_remittance_filings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
    )
  );
