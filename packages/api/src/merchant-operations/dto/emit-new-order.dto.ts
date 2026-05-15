import { IsObject, IsUUID } from 'class-validator';

export class EmitNewOrderDto {
  @IsUUID()
  merchant_id!: string;

  @IsObject()
  order!: Record<string, unknown>;
}
