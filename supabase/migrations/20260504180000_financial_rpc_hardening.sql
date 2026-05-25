-- DB-level hardening for payment references and privileged money RPCs.

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paystack_reference_unique
  ON public.orders(paystack_reference)
  WHERE paystack_reference IS NOT NULL;

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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ledger_id  UUID;
  v_commission NUMERIC(12,2);
  v_vat        NUMERIC(12,2);
  v_net        NUMERIC(12,2);
BEGIN
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
  ON CONFLICT (order_id) DO NOTHING
  RETURNING id INTO v_ledger_id;

  IF v_ledger_id IS NULL THEN
    SELECT pcl.id, pcl.commission_amount, pcl.vat_amount, pcl.merchant_net
    INTO v_ledger_id, v_commission, v_vat, v_net
    FROM public.platform_commission_ledger pcl
    WHERE pcl.order_id = p_order_id
    LIMIT 1;

    RETURN QUERY SELECT v_ledger_id, v_commission, v_vat, v_net, TRUE;
    RETURN;
  END IF;

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
  )
  ON CONFLICT (reference) DO NOTHING;

  RETURN QUERY SELECT v_ledger_id, v_commission, v_vat, v_net, FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_merchant_pending_for_order(
  p_order_id UUID
) RETURNS TABLE (
  released BOOLEAN,
  reason   TEXT,
  amount   NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ledger        RECORD;
  v_open_dispute  UUID;
  v_pending_tx_id UUID;
  v_updated       INTEGER;
BEGIN
  SELECT pcl.id, pcl.merchant_id, pcl.merchant_net, pcl.released_at
  INTO v_ledger
  FROM public.platform_commission_ledger pcl
  WHERE pcl.order_id = p_order_id
  LIMIT 1
  FOR UPDATE;

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

  SELECT id INTO v_pending_tx_id
  FROM public.merchant_wallet_transactions
  WHERE order_id = p_order_id
    AND type = 'credit'
    AND status = 'pending'
  LIMIT 1
  FOR UPDATE;

  IF v_pending_tx_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'no_pending_credit'::TEXT, v_ledger.merchant_net;
    RETURN;
  END IF;

  UPDATE public.merchant_wallets
  SET pending_balance   = pending_balance - v_ledger.merchant_net,
      available_balance = available_balance + v_ledger.merchant_net,
      updated_at        = NOW()
  WHERE merchant_id = v_ledger.merchant_id
    AND pending_balance >= v_ledger.merchant_net;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN QUERY SELECT FALSE, 'insufficient_pending_balance'::TEXT, v_ledger.merchant_net;
    RETURN;
  END IF;

  UPDATE public.merchant_wallet_transactions
  SET status = 'completed'
  WHERE id = v_pending_tx_id;

  UPDATE public.platform_commission_ledger
  SET released_at = NOW()
  WHERE id = v_ledger.id
    AND released_at IS NULL;

  RETURN QUERY SELECT TRUE, 'released'::TEXT, v_ledger.merchant_net;
END;
$$;

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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_merchant_id UUID;
  v_pending     NUMERIC;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.merchant_wallet_transactions
    WHERE reference = 'REFUND-' || p_dispute_id::TEXT
  ) THEN
    RETURN QUERY SELECT TRUE, 'already_clawed_back'::TEXT;
    RETURN;
  END IF;

  SELECT merchant_id INTO v_merchant_id
  FROM public.platform_commission_ledger
  WHERE order_id = p_order_id
  LIMIT 1
  FOR UPDATE;

  IF v_merchant_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'no_ledger'::TEXT;
    RETURN;
  END IF;

  SELECT pending_balance INTO v_pending
  FROM public.merchant_wallets
  WHERE merchant_id = v_merchant_id
  FOR UPDATE;

  IF v_pending < p_refund_amount THEN
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
  )
  ON CONFLICT (reference) DO NOTHING;

  UPDATE public.merchant_wallet_transactions
  SET status = 'reversed'
  WHERE order_id = p_order_id
    AND type = 'credit'
    AND status = 'pending';

  RETURN QUERY SELECT TRUE, 'clawed_back'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.merchant_wallet_restore_failed_withdrawal(
  p_merchant_id   UUID,
  p_withdrawal_id UUID,
  p_amount        NUMERIC,
  p_reason        TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reversed INTEGER;
BEGIN
  UPDATE public.merchant_wallet_transactions
  SET status = 'reversed'
  WHERE withdrawal_id = p_withdrawal_id
    AND type = 'withdrawal'
    AND status = 'pending';

  GET DIAGNOSTICS v_reversed = ROW_COUNT;
  IF v_reversed = 0 THEN
    RETURN;
  END IF;

  UPDATE public.merchant_wallets
  SET available_balance = available_balance + p_amount,
      total_withdrawn   = GREATEST(0, total_withdrawn - p_amount),
      updated_at        = NOW()
  WHERE merchant_id = p_merchant_id;

  INSERT INTO public.merchant_wallet_transactions (
    merchant_id, type, amount, commission_amount, net_amount,
    reference, withdrawal_id, description, status
  )
  VALUES (
    p_merchant_id, 'manual_credit', p_amount, 0, p_amount,
    CONCAT('RESTORE-', p_withdrawal_id::TEXT),
    p_withdrawal_id,
    CONCAT('Withdrawal failed — balance restored: ', LEFT(COALESCE(p_reason, 'unknown'), 500)),
    'completed'
  )
  ON CONFLICT (reference) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_merchant_for_delivered_order(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_merchant_pending_for_order(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.clawback_merchant_pending_for_refund(UUID, UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.merchant_wallet_debit_withdrawal(UUID, NUMERIC, UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.merchant_wallet_restore_failed_withdrawal(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.credit_merchant_for_delivered_order(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_merchant_pending_for_order(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.clawback_merchant_pending_for_refund(UUID, UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.merchant_wallet_debit_withdrawal(UUID, NUMERIC, UUID, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.merchant_wallet_restore_failed_withdrawal(UUID, UUID, NUMERIC, TEXT) TO service_role;
