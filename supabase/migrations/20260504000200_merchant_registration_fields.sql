-- Merchant registration / onboarding fields + profiles.role extension.
-- Reference: chopfast-multivendor-skill references/02-merchant-onboarding.md

-- -----------------------------------------------------------------------------
-- profiles.role: allow merchant portal users
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'staff', 'merchant'));

-- -----------------------------------------------------------------------------
-- merchants: owner + application tracking (no plaintext NIN/BVN)
-- -----------------------------------------------------------------------------
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS owner_full_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS identity_number_hash TEXT,
  ADD COLUMN IF NOT EXISTS number_of_locations VARCHAR(32),
  ADD COLUMN IF NOT EXISTS application_reference VARCHAR(40) UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_application_reference
  ON public.merchants(application_reference)
  WHERE application_reference IS NOT NULL;

COMMENT ON COLUMN public.merchants.identity_number_hash IS
  'Bcrypt hash of normalized 11-digit NIN/BVN — never store raw identifier in plain text.';

-- -----------------------------------------------------------------------------
-- merchant_documents: NAFDAC permit (food production / handler)
-- -----------------------------------------------------------------------------
ALTER TABLE public.merchant_documents
  DROP CONSTRAINT IF EXISTS merchant_documents_doc_type_check;

ALTER TABLE public.merchant_documents
  ADD CONSTRAINT merchant_documents_doc_type_check CHECK (doc_type IN (
    'CAC', 'BVN', 'NIN', 'FSSAI', 'bank_statement',
    'owner_id', 'utility_bill', 'NAFDAC', 'other'
  ));
