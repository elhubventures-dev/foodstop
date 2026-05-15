import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const TICKET_STATUSES = [
  'open',
  'awaiting_ops',
  'awaiting_merchant',
  'resolved',
  'closed',
] as const;

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @IsOptional()
  @IsString()
  @IsIn([...PRIORITIES])
  priority?: (typeof PRIORITIES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body?: string;
}

export class PostSupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body!: string;
}

export class PatchSupportTicketDto {
  @IsOptional()
  @IsString()
  @IsIn([...TICKET_STATUSES])
  status?: (typeof TICKET_STATUSES)[number];

  @IsOptional()
  @IsString()
  @IsIn([...PRIORITIES])
  priority?: (typeof PRIORITIES)[number];

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject?: string;
}
