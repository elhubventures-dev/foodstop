-- Atomic merchant wallet debit / restore for withdrawals (NestJS @chopfast/api).

CREATE OR REPLACE FUNCTION public.merchant_wallet_debit_withdrawal(
  p_merchant_id   UUID,
  p_amount        NUMERIC,
  p_withdrawal_id UUID,
  p_reference     VARCHAR(100)
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.merchant_wallets
  SET available_balance = available_balance - p_amount,
      total_withdrawn   = total_withdrawn + p_amount,
      updated_at        = NOW()
  WHERE merchant_id = p_merchant_id
    AND available_balance >= p_amount;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  INSERT INTO public.merchant_wallet_transactions (
    merchant_id, type, amount, commission_amount, net_amount,
    reference, withdrawal_id, description, status
  )
  VALUES (
    p_merchant_id, 'withdrawal', p_amount, 0, -p_amount,
    p_reference, p_withdrawal_id,
    CONCAT('Withdrawal request ', p_withdrawal_id::TEXT),
    'pending'
  );
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
AS $$
BEGIN
  UPDATE public.merchant_wallets
  SET available_balance = available_balance + p_amount,
      total_withdrawn   = GREATEST(0, total_withdrawn - p_amount),
      updated_at        = NOW()
  WHERE merchant_id = p_merchant_id;

  UPDATE public.merchant_wallet_transactions
  SET status = 'reversed'
  WHERE withdrawal_id = p_withdrawal_id
    AND type = 'withdrawal'
    AND status = 'pending';

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
  );
END;
$$;
