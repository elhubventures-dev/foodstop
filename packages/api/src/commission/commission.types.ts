export const RELEASE_PENDING_QUEUE = 'release-pending-balance';
export const RELEASE_PENDING_JOB_NAME = 'release';

export interface ReleasePendingJobData {
  merchantId: string;
  orderId: string;
  amount: number;
  scheduledFor: string;
  cause: 'initial' | 'dispute_resolved';
}

export interface OrderRow {
  id: string;
  user_id: string | null;
  merchant_id: string | null;
  status: string;
  subtotal: number | string;
  delivery_fee: number | string | null;
  tax: number | string | null;
  discount: number | string | null;
  total: number | string;
  paystack_reference: string | null;
}

export interface MerchantRow {
  id: string;
  business_name: string;
  commission_rate: number | string | null;
  is_suspended: boolean;
}

export interface CommissionResult {
  ledgerId: string;
  orderId: string;
  merchantId: string;
  foodSubtotal: number;
  commissionRate: number;
  commissionAmount: number;
  vatAmount: number;
  merchantNet: number;
  releaseScheduledAt: Date;
  wasIdempotent: boolean;
}

export interface CreditRpcRow {
  ledger_id: string;
  commission_amt: string | number;
  vat_amount: string | number;
  merchant_net: string | number;
  was_idempotent: boolean;
}

export interface ReleaseRpcRow {
  released: boolean;
  reason: string;
  amount: string | number;
}

export function jobIdForOrder(orderId: string): string {
  return `release:${orderId}`;
}
