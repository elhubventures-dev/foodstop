import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class NotifyMerchantApplicationDto {
  @IsUUID()
  merchant_id!: string;

  @IsIn(['approved', 'rejected', 'rfi'])
  event!: 'approved' | 'rejected' | 'rfi';

  /** Required for rejected and rfi — admin note / reason shown to the merchant. */
  @ValidateIf((o: NotifyMerchantApplicationDto) =>
    ['rejected', 'rfi'].includes(o.event),
  )
  @IsString()
  @MinLength(8)
  message?: string;
}
