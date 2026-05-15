import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const CATEGORIES = [
  'Fast Food',
  'Local Cuisine',
  'Fine Dining',
  'Bakery',
  'Cloud Kitchen',
  'Grills & BBQ',
  'Chinese',
  'Continental',
  'Other',
] as const;

const CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Benin City',
  'Enugu',
  'Kaduna',
  'Jos',
  'Warri',
  'Other',
] as const;

export class MerchantDocumentsPayloadDto {
  /** Cloudinary HTTPS URL — CAC certificate */
  @IsString()
  @IsNotEmpty()
  cac!: string;

  /** Cloudinary HTTPS URL — owner government ID */
  @IsString()
  @IsNotEmpty()
  owner_id!: string;

  /** Cloudinary HTTPS URL — utility bill (≤ 3 months) */
  @IsString()
  @IsNotEmpty()
  utility_bill!: string;

  @IsOptional()
  @IsString()
  nafdac?: string;

  @IsOptional()
  @IsString()
  fssai?: string;
}

/** Step 1 — Business information */
export class MerchantRegistrationStep1Dto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  business_name!: string;

  @IsEmail()
  business_email!: string;

  @IsString()
  @IsNotEmpty()
  business_phone!: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  cuisine_types!: string[];

  @IsIn(CITIES)
  city!: (typeof CITIES)[number];

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  business_address!: string;

  @IsString()
  @MinLength(50)
  @MaxLength(500)
  description!: string;

  @IsIn(['one', 'two_to_five', 'gt_five'])
  number_of_locations!: 'one' | 'two_to_five' | 'gt_five';
}

/** Step 2 — Owner + auth + OTP (OTP verified server-side; hash in Redis, email via Resend) */
export class MerchantRegistrationStep2Dto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  owner_name!: string;

  @IsString()
  @IsNotEmpty()
  owner_phone!: string;

  @IsEmail()
  owner_email!: string;

  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/,
    {
      message:
        'Password must be 8+ chars with uppercase, lowercase, number, and special character',
    },
  )
  password!: string;

  @IsString()
  @MinLength(8)
  confirm_password!: string;

  /** Exactly 11 digits — NIN or BVN */
  @Matches(/^\d{11}$/)
  nin_or_bvn!: string;

  @IsIn(['NIN', 'BVN'])
  nin_bvn_type!: 'NIN' | 'BVN';

  /** 6-digit OTP received via email (Resend) */
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  otp!: string;
}

/** Step 3 — Document URLs (already uploaded to Cloudinary from the client) */
export class MerchantRegistrationStep3Dto {
  @ValidateNested()
  @Type(() => MerchantDocumentsPayloadDto)
  documents!: MerchantDocumentsPayloadDto;
}

/** Step 4 — Banking + legal acknowledgements */
export class MerchantRegistrationStep4Dto {
  @IsString()
  @Matches(/^\d{3,6}$/)
  bank_code!: string;

  @IsString()
  @Matches(/^\d{10}$/)
  account_number!: string;

  @IsBoolean()
  confirm_bank_account!: boolean;

  @IsBoolean()
  agree_merchant_agreement!: boolean;

  @IsBoolean()
  acknowledge_commission!: boolean;
}

/**
 * Full 5-step registration payload (steps 1–4 carry data; step 5 is review-only in UI).
 */
export class RegisterMerchantDto {
  @ValidateNested()
  @Type(() => MerchantRegistrationStep1Dto)
  step1!: MerchantRegistrationStep1Dto;

  @ValidateNested()
  @Type(() => MerchantRegistrationStep2Dto)
  step2!: MerchantRegistrationStep2Dto;

  @ValidateNested()
  @Type(() => MerchantRegistrationStep3Dto)
  step3!: MerchantRegistrationStep3Dto;

  @ValidateNested()
  @Type(() => MerchantRegistrationStep4Dto)
  step4!: MerchantRegistrationStep4Dto;
}
