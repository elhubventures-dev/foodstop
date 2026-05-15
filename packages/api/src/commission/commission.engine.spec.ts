import {
  computeCancellationPlatformFee,
  computeDeliveredOrderLedger,
  computeRefundClawbackMerchantAmount,
  CANCELLATION_FEE_AFTER_ACCEPT_RATE,
  DEFAULT_DELIVERED_COMMISSION_RATE,
  foodSubtotalForCommission,
  GOLD_TIER_COMMISSION_RATE,
  resolveDeliveredCommissionRate,
} from './commission.engine';

describe('commission.engine — delivered (RPC-aligned)', () => {
  it('applies correct 15% commission on food subtotal with default VAT rate 7.5%', () => {
    const food = 10_000;
    const vatRate = 0.075;
    const out = computeDeliveredOrderLedger({
      foodSubtotal: food,
      commissionRate: DEFAULT_DELIVERED_COMMISSION_RATE,
      vatRate,
    });
    expect(out.commissionAmount).toBe(1500);
    expect(out.vatAmount).toBe(750);
    expect(out.merchantNet).toBe(8500);
  });

  it('uses food subtotal only — excludes delivery and VAT bundled in order total', () => {
    const order = {
      subtotal: 8000,
      delivery_fee: 1200,
      tax: 600,
      total: 9800,
    };
    const food = foodSubtotalForCommission(order);
    expect(food).toBe(8000);
    const out = computeDeliveredOrderLedger({
      foodSubtotal: food,
      commissionRate: DEFAULT_DELIVERED_COMMISSION_RATE,
      vatRate: 0.075,
    });
    expect(out.commissionAmount).toBe(1200);
    expect(out.merchantNet).toBe(6800);
  });

  it('uses Gold tier 11% commission when merchant rate is 0.11', () => {
    const resolved = resolveDeliveredCommissionRate(
      GOLD_TIER_COMMISSION_RATE,
      DEFAULT_DELIVERED_COMMISSION_RATE,
    );
    expect(resolved).toBe(0.11);
    const out = computeDeliveredOrderLedger({
      foodSubtotal: 20_000,
      commissionRate: resolved,
      vatRate: 0.075,
    });
    expect(out.commissionAmount).toBe(2200);
    expect(out.merchantNet).toBe(17_800);
    expect(out.vatAmount).toBe(1500);
  });
});

describe('commission.engine — cancellation fees', () => {
  it('charges 0% when cancelled before merchant acceptance', () => {
    const food = 50_000;
    const out = computeCancellationPlatformFee({
      foodSubtotal: food,
      merchantHasAcceptedOrder: false,
    });
    expect(out.fee).toBe(0);
    expect(out.effectiveRate).toBe(0);
  });

  it('charges 5% on food subtotal when cancelled after merchant acceptance', () => {
    const food = 40_000;
    const out = computeCancellationPlatformFee({
      foodSubtotal: food,
      merchantHasAcceptedOrder: true,
    });
    expect(out.effectiveRate).toBe(CANCELLATION_FEE_AFTER_ACCEPT_RATE);
    expect(out.fee).toBe(2000);
  });
});

describe('commission.engine — refund clawback', () => {
  it('computes proportional clawback from previously credited merchant net', () => {
    const merchantNet = 8500;
    const half = computeRefundClawbackMerchantAmount({
      merchantNetPreviouslyCredited: merchantNet,
      refundFractionOfMerchantNet: 0.5,
    });
    expect(half).toBe(4250);
    const full = computeRefundClawbackMerchantAmount({
      merchantNetPreviouslyCredited: merchantNet,
      refundFractionOfMerchantNet: 1,
    });
    expect(full).toBe(8500);
  });

  it('clamps refund fraction to [0, 1]', () => {
    expect(
      computeRefundClawbackMerchantAmount({
        merchantNetPreviouslyCredited: 1000,
        refundFractionOfMerchantNet: 2,
      }),
    ).toBe(1000);
    expect(
      computeRefundClawbackMerchantAmount({
        merchantNetPreviouslyCredited: 1000,
        refundFractionOfMerchantNet: -1,
      }),
    ).toBe(0);
  });
});

describe('commission.engine — resolveDeliveredCommissionRate', () => {
  it('falls back to default when merchant rate is null or zero', () => {
    expect(
      resolveDeliveredCommissionRate(null, DEFAULT_DELIVERED_COMMISSION_RATE),
    ).toBe(0.15);
    expect(
      resolveDeliveredCommissionRate(0, DEFAULT_DELIVERED_COMMISSION_RATE),
    ).toBe(0.15);
  });
});
