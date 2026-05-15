import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @IsUUID()
  bank_account_id!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Min(1)
  amount!: number;
}
