import { IsIn, IsString } from 'class-validator';

/** Status values a verified merchant may set from the operations API. */
export const MERCHANT_SETTABLE_ORDER_STATUSES = [
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'cancelled',
] as const;

export type MerchantSettableOrderStatus =
  (typeof MERCHANT_SETTABLE_ORDER_STATUSES)[number];

const STATUS_LIST = MERCHANT_SETTABLE_ORDER_STATUSES as unknown as string[];

export class PatchOrderStatusDto {
  @IsString()
  @IsIn(STATUS_LIST)
  status!: MerchantSettableOrderStatus;
}
