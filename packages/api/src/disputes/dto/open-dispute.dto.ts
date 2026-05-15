import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const DISPUTE_REASONS = [
  'wrong_item',
  'missing_item',
  'poor_quality',
  'not_delivered',
  'overcharged',
  'other',
] as const;

export type DisputeReason = (typeof DISPUTE_REASONS)[number];

export class OpenDisputeDto {
  @IsUUID()
  orderId!: string;

  @IsUUID()
  customerId!: string;

  @IsIn(DISPUTE_REASONS)
  reason!: DisputeReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}
