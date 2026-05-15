import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';

import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { RequestMerchantOtpDto } from './dto/request-merchant-otp.dto';
import { MerchantRegistrationService } from './merchant-registration.service';

/**
 * Public merchant onboarding API (no InternalAuthGuard).
 * Full URL with global prefix: POST /api/v1/merchant/register
 */
@Controller('merchant')
export class MerchantRegistrationController {
  private readonly logger = new Logger(MerchantRegistrationController.name);

  constructor(private readonly registration: MerchantRegistrationService) {}

  /**
   * Send OTP to owner_email via Resend. Stores HMAC hash in Redis for verification
   * during POST /merchant/register (must be same email as step2.owner_email).
   */
  @Post('register/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestMerchantOtpDto): Promise<unknown> {
    const tail = dto.owner_email.includes('@')
      ? dto.owner_email.split('@')[1]?.slice(0, 24) ?? ''
      : '';
    this.logger.log(`OTP request for owner_email @${tail}`);
    return this.registration.requestOwnerOtp(dto.owner_email);
  }

  /**
   * Full 5-step registration payload (steps 1–4). Creates auth user, merchant,
   * documents, and verified bank account after OTP + Paystack resolve checks.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterMerchantDto): Promise<unknown> {
    return this.registration.register(dto);
  }
}
