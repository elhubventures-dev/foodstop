-- Super-admin merchant application queue: SLA anchor + request-for-information note.

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS application_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS application_rfi_message TEXT;

COMMENT ON COLUMN public.merchants.application_submitted_at IS
  'When the merchant submitted their application (SLA clock starts).';
COMMENT ON COLUMN public.merchants.application_rfi_message IS
  'Last admin “request more info” note; cleared on approve.';

UPDATE public.merchants
SET application_submitted_at = COALESCE(application_submitted_at, created_at)
WHERE application_submitted_at IS NULL;
