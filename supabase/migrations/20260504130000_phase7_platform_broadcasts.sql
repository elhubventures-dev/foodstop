-- Phase 7 — Super admin: platform broadcast audit + customer in-app feed
-- Merchant in-app uses existing public.merchant_notifications.

CREATE TABLE IF NOT EXISTS public.platform_broadcasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  body            TEXT NOT NULL,
  channels        TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  audience        VARCHAR(40) NOT NULL DEFAULT 'all_merchants'
    CHECK (audience IN (
      'all_merchants',
      'selected_merchants',
      'all_customers'
    )),
  merchant_ids    UUID[],
  status          VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipient_count INTEGER,
  error_detail    TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_created
  ON public.platform_broadcasts(created_at DESC);

COMMENT ON TABLE public.platform_broadcasts IS
  'Super-admin broadcast campaigns; in-app fan-out uses merchant_notifications / customer_announcements.';

-- Global customer-facing announcements (web/mobile can list recent rows).
CREATE TABLE IF NOT EXISTS public.customer_announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(200) NOT NULL,
  body         TEXT NOT NULL,
  broadcast_id UUID REFERENCES public.platform_broadcasts(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_announcements_created
  ON public.customer_announcements(created_at DESC);
