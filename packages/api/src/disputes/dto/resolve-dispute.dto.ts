import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export const DISPUTE_OUTCOMES = [
  'resolved_refund',
  'resolved_no_refund',
  'closed',
] as const;

export type DisputeOutcome = (typeof DISPUTE_OUTCOMES)[number];

export class ResolveDisputeDto {
  @IsUUID()
  disputeId!: string;

  @IsIn(DISPUTE_OUTCOMES)
  outcome!: DisputeOutcome;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @IsOptional()
  @IsString()
  resolutionNote?: string;

  @IsOptional()
  @IsUUID()
  resolvedBy?: string;
}
