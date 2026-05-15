import { Type } from 'class-transformer';
import { IsNumber, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class ValidatePromoDto {
  @IsUUID()
  merchant_id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  delivery_fee!: number;
}
