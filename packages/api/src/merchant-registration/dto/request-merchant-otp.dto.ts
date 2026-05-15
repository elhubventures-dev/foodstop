import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** POST /merchant/register/request-otp — send OTP to owner_email via Resend. */
export class RequestMerchantOtpDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  owner_email!: string;
}
