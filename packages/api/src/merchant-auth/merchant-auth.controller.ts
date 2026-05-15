import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { MerchantLoginDto } from './dto/merchant-login.dto';
import { MerchantAuthService } from './merchant-auth.service';

/**
 * Public merchant auth — issues ChopFast merchant JWT (not Supabase session JWT).
 * Full paths: POST /api/v1/merchant/auth/login
 */
@Controller('merchant/auth')
export class MerchantAuthController {
  constructor(private readonly auth: MerchantAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: MerchantLoginDto): Promise<unknown> {
    return this.auth.loginWithPassword(dto.email, dto.password);
  }
}
