import { IsUUID } from 'class-validator';

export class TriggerCommissionDto {
  @IsUUID()
  orderId!: string;
}
