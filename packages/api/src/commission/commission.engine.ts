/**
 * Pure commission calculations — must stay aligned with
 * `public.credit_merchant_for_delivered_order` in
 * `supabase/migrations/20260504000100_commission_engine_rpc.sql`.
 *
 * ChopFast skill rules implemented here for unit testing:
 * - Delivered: commission on **food subtotal** only (not delivery_fee / order tax in `total`).
 * - Cancellation before merchant acceptance: **0%** platform fee on food.
 * - Cancellation after acceptance: **5%** platform fee on food subtotal.
 * - Tier overrides: e.g. Gold **11%** via merchant `commission_rate` when processing delivery.
 */

export const DEFAULT_DELIVERED_COMMISSION_RATE = 0.15;
/** Platform fee on food when order is cancelled after merchant has accepted (skill). */
export const CANCELLATION_FEE_AFTER_ACCEPT_RATE = 0.05;
/** Gold / negotiated tier example (skill). */
export const GOLD_TIER_COMMISSION_RATE = 0.11;

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

/**
 * Food subtotal used for commission (matches `CommissionService`: `order.subtotal`).
 * Delivery and VAT live on `total` / `tax` / `delivery_fee` — excluded from this base.
 */
export function foodSubtotalForCommission(order: {
  subtotal: number | string;
  total?: number | string;
  delivery_fee?: number | string | null;
  tax?: number | string | null;
}): number {
  return round2(toNumber(order.subtotal));
}

/**
 * Merchant-specific rate when set & positive; else default (same as CommissionService).
 */
export function resolveDeliveredCommissionRate(
  merchantCommissionRate: number | string | null | undefined,
  defaultRate: number,
): number {
  const n = toNumber(merchantCommissionRate);
  return n > 0 ? n : defaultRate;
}

/**
 * Mirrors `credit_merchant_for_delivered_order` ledger math (pre-wallet side effects).
 * VAT is recorded on food base; merchant_net is food − commission (VAT not deducted from net in RPC).
 */
export function computeDeliveredOrderLedger(params: {
  foodSubtotal: number;
  commissionRate: number;
  vatRate: number;
}): {
  commissionAmount: number;
  vatAmount: number;
  merchantNet: number;
} {
  const { foodSubtotal, commissionRate, vatRate } = params;
  const f = round2(foodSubtotal);
  const commissionAmount = round2(f * commissionRate);
  const vatAmount = round2(f * vatRate);
  const merchantNet = round2(f - commissionAmount);
  return { commissionAmount, vatAmount, merchantNet };
}

/**
 * Cancellation policy: before acceptance → no platform cut; after → 5% of food subtotal.
 */
export function computeCancellationPlatformFee(params: {
  foodSubtotal: number;
  merchantHasAcceptedOrder: boolean;
}): { fee: number; effectiveRate: number } {
  const food = round2(params.foodSubtotal);
  if (!params.merchantHasAcceptedOrder) {
    return { fee: 0, effectiveRate: 0 };
  }
  return {
    fee: round2(food * CANCELLATION_FEE_AFTER_ACCEPT_RATE),
    effectiveRate: CANCELLATION_FEE_AFTER_ACCEPT_RATE,
  };
}

/**
 * Merchant-side amount to claw back for a refund (proportional to credited net), before wallet RPC.
 */
export function computeRefundClawbackMerchantAmount(params: {
  merchantNetPreviouslyCredited: number;
  refundFractionOfMerchantNet: number;
}): number {
  const { merchantNetPreviouslyCredited, refundFractionOfMerchantNet } = params;
  const frac = Math.min(1, Math.max(0, refundFractionOfMerchantNet));
  return round2(round2(merchantNetPreviouslyCredited) * frac);
}
