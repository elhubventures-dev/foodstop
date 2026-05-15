-- Merchant ↔ platform support tickets (portal Phase 5 completion)

CREATE TABLE IF NOT EXISTS public.merchant_support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id  UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  subject      VARCHAR(200) NOT NULL,
  status       VARCHAR(30) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'awaiting_ops', 'awaiting_merchant', 'resolved', 'closed')),
  priority     VARCHAR(10) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_support_tickets_merchant
  ON public.merchant_support_tickets(merchant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.merchant_support_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID NOT NULL REFERENCES public.merchant_support_tickets(id) ON DELETE CASCADE,
  author_role  VARCHAR(20) NOT NULL CHECK (author_role IN ('merchant', 'ops')),
  body         TEXT NOT NULL,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_support_messages_ticket
  ON public.merchant_support_messages(ticket_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.touch_merchant_support_tickets_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_merchant_support_tickets_updated ON public.merchant_support_tickets;
CREATE TRIGGER trg_merchant_support_tickets_updated
  BEFORE UPDATE ON public.merchant_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_merchant_support_tickets_updated();
