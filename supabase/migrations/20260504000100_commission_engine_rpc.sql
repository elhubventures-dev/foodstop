-- =============================================================================
-- ChopFast Multi-Vendor — Commission Engine RPC Functions
-- These functions wrap multi-row writes in a single Postgres transaction so
-- the API service can call them atomically via supabase-js .rpc().
-- =============================================================================

-- One commission ledger row per order. Enforces idempotency for processOrderCommission.
ALTER TABLE public.platform_commission_ledger
  DROP CONSTRAINT IF EXISTS platform_commission_ledger_order_uniq;

ALTER TABLE public.platform_commission_ledger
  ADD CONSTRAINT platform_commission_ledger_order_uniq UNIQUE (order_id);

-- -----------------------------------------------------------------------------
-- credit_merchant_for_delivered_order
-- Atomically:
--   1. inserts platform_commission_ledger row (idempotent via unique(order_id))
--   2. credits merchant_wallets.pending_balance and total_earned, total_commission_paid
--   3. inserts merchant_wallet_transactions row (status = 'pending')
-- Returns: ledger row + merchant_net so the caller can schedule the release job.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_merchant_for_delivered_order(
  p_order_id        UUID,
  p_merchant_id     UUID,
  p_food_subtotal   NUMERIC,
  p_grand_total     NUMERIC,
  p_commission_rate NUMERIC,
  p_vat_rate        NUMERIC,
  p_order_reference TEXT
) RETURNS TABLE (
  ledger_id        UUID,
  commission_amt   NUMERIC,
  vat_amount       NUMERIC,
  merchant_net     NUMERIC,
  was_idempotent   BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ledger_id      UUID;
  v_commission     NUMERIC(12,2);
  v_vat            NUMERIC(12,2);
  v_net            NUMERIC(12,2);
  v_existing       UUID;
BEGIN
  -- Idempotency check
  SELECT id INTO v_existing
  FROM public.platform_commission_ledger
  WHERE order_id = p_order_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    SELECT pcl.id, pcl.commission_amount, pcl.vat_amount, pcl.merchant_net
    INTO v_ledger_id, v_commission, v_vat, v_net
    FROM public.platform_commission_ledger pcl
    WHERE pcl.id = v_existing;
    RETURN QUERY SELECT v_ledger_id, v_commission, v_vat, v_net, TRUE;
    RETURN;
  END IF;

  v_commission := ROUND(p_food_subtotal * p_commission_rate, 2);
  v_vat        := ROUND(p_food_subtotal * p_vat_rate, 2);
  v_net        := ROUND(p_food_subtotal - v_commission, 2);

  INSERT INTO public.platform_commission_ledger (
    order_id, merchant_id, order_grand_total, food_subtotal,
    commission_rate, commission_amount, vat_amount, merchant_net
  )
  VALUES (
    p_order_id, p_merchant_id, p_grand_total, p_food_subtotal,
    p_commission_rate, v_commission, v_vat, v_net
  )
  RETURNING id INTO v_ledger_id;

  -- Credit merchant pending wallet (create wallet on first use)
  INSERT INTO public.merchant_wallets (merchant_id, pending_balance, total_earned, total_commission_paid)
  VALUES (p_merchant_id, v_net, v_net, v_commission)
  ON CONFLICT (merchant_id) DO UPDATE SET
    pending_balance       = public.merchant_wallets.pending_balance + v_net,
    total_earned          = public.merchant_wallets.total_earned + v_net,
    total_commission_paid = public.merchant_wallets.total_commission_paid + v_commission,
    updated_at            = NOW();

  INSERT INTO public.merchant_wallet_transactions (
    merchant_id, type, amount, commission_amount, net_amount,
    reference, order_id, description, status
  )
  VALUES (
    p_merchant_id, 'credit', p_food_subtotal, v_commission, v_net,
    'CREDIT-' || p_order_id::TEXT,
    p_order_id,
    CONCAT('Order #', COALESCE(p_order_reference, p_order_id::TEXT), ' delivered'),
    'pending'
  );

  RETURN QUERY SELECT v_ledger_id, v_commission, v_vat, v_net, FALSE;
END;
$$;

-- -----------------------------------------------------------------------------
-- release_merchant_pending_for_order
-- Moves pending → available, marks ledger.released_at, marks pending tx 'completed'.
-- Refuses to release if an open dispute exists for the order.
-- Returns: { released boolean, reason text, amount numeric }
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_merchant_pending_for_order(
  p_order_id UUID
) RETURNS TABLE (
  released BOOLEAN,
  reason   TEXT,
  amount   NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ledger          RECORD;
  v_open_dispute    UUID;
  v_pending_tx_id   UUID;
BEGIN
  SELECT pcl.id, pcl.merchant_id, pcl.merchant_net, pcl.released_at
  INTO v_ledger
  FROM public.platform_commission_ledger pcl
  WHERE pcl.order_id = p_order_id
  LIMIT 1;

  IF v_ledger IS NULL THEN
    RETURN QUERY SELECT FALSE, 'no_ledger'::TEXT, 0::NUMERIC;
    RETURN;
  END IF;

  IF v_ledger.released_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'already_released'::TEXT, v_ledger.merchant_net;
    RETURN;
  END IF;

  SELECT id INTO v_open_dispute
  FROM public.dispute_cases
  WHERE order_id = p_order_id
    AND status IN ('open', 'investigating')
  LIMIT 1;

  IF v_open_dispute IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'dispute_open'::TEXT, v_ledger.merchant_net;
    RETURN;
  END IF;

  -- Guard against double-spend: if the original pending credit has been
  -- reversed by a clawback (refund-resolved dispute), do NOT release.
  SELECT id INTO v_pending_tx_id
  FROM public.merchant_wallet_transactions
  WHERE order_id = p_order_id
    AND type = 'credit'
    AND status = 'pending'
  LIMIT 1;

  IF v_pending_tx_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'no_pending_credit'::TEXT, v_ledger.merchant_net;
    RETURN;
  END IF;

  UPDATE public.merchant_wallets
  SET pending_balance   = pending_balance - v_ledger.merchant_net,
      available_balance = available_balance + v_ledger.merchant_net,
      updated_at        = NOW()
  WHERE merchant_id = v_ledger.merchant_id;

  UPDATE public.merchant_wallet_transactions
  SET status = 'completed'
  WHERE order_id = p_order_id
    AND type = 'credit'
    AND status = 'pending';

  UPDATE public.platform_commission_ledger
  SET released_at = NOW()
  WHERE id = v_ledger.id;

  RETURN QUERY SELECT TRUE, 'released'::TEXT, v_ledger.merchant_net;
END;
$$;

-- -----------------------------------------------------------------------------
-- clawback_merchant_pending_for_refund
-- Used when a dispute resolves with a (full or partial) refund and the funds are
-- still in pending. Decrements pending_balance and writes a refund_deduction tx.
-- p_refund_amount is the merchant-side clawback (after platform commission share).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clawback_merchant_pending_for_refund(
  p_order_id      UUID,
  p_dispute_id    UUID,
  p_refund_amount NUMERIC
) RETURNS TABLE (
  ok      BOOLEAN,
  reason  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_merchant_id  UUID;
  v_pending      NUMERIC;
BEGIN
  SELECT merchant_id INTO v_merchant_id
  FROM public.platform_commission_ledger
  WHERE order_id = p_order_id
  LIMIT 1;

  IF v_merchant_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'no_ledger'::TEXT;
    RETURN;
  END IF;

  SELECT pending_balance INTO v_pending
  FROM public.merchant_wallets
  WHERE merchant_id = v_merchant_id;

  IF v_pending < p_refund_amount THEN
    -- Take what we can from pending, the remainder must come from available_balance
    UPDATE public.merchant_wallets
    SET pending_balance   = 0,
        available_balance = available_balance - (p_refund_amount - v_pending),
        updated_at        = NOW()
    WHERE merchant_id = v_merchant_id;
  ELSE
    UPDATE public.merchant_wallets
    SET pending_balance = pending_balance - p_refund_amount,
        updated_at      = NOW()
    WHERE merchant_id = v_merchant_id;
  END IF;

  INSERT INTO public.merchant_wallet_transactions (
    merchant_id, type, amount, commission_amount, net_amount,
    reference, order_id, description, status
  )
  VALUES (
    v_merchant_id, 'refund_deduction', p_refund_amount, 0, -p_refund_amount,
    'REFUND-' || p_dispute_id::TEXT,
    p_order_id,
    CONCAT('Dispute refund clawback (case ', p_dispute_id::TEXT, ')'),
    'completed'
  );

  -- Cancel the original pending credit transaction so it cannot be released later
  UPDATE public.merchant_wallet_transactions
  SET status = 'reversed'
  WHERE order_id = p_order_id
    AND type = 'credit'
    AND status = 'pending';

  RETURN QUERY SELECT TRUE, 'clawed_back'::TEXT;
END;
$$;
