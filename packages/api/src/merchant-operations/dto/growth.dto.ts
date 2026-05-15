import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMerchantLocationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address_line?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class ReferralInviteDto {
  @IsEmail()
  email!: string;
}

export class MerchantVatRecordDto {
  @IsString()
  period_start!: string;

  @IsString()
  period_end!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vat_amount_ngn!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class MarketingAudienceDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsBoolean()
  opted_in?: boolean;
}

export class MarketingCampaignDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  body_plain!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4)
  weekly_cap_per_recipient?: number;
}

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body!: string;
}

export class BookFeaturedSlotDto {
  @IsString()
  @IsIn(['homepage_hero', 'category_top', 'search_top'])
  slot_type!: 'homepage_hero' | 'category_top' | 'search_top';

  @IsString()
  start_date!: string;

  @IsString()
  end_date!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount_paid?: number;
}
