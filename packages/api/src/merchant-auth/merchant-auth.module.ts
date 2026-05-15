import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { MerchantAuthController } from './merchant-auth.controller';
import { MerchantAuthService } from './merchant-auth.service';
import { MerchantJwtGuard } from './guards/merchant-jwt.guard';
import { MerchantVerifiedGuard } from './guards/merchant-verified.guard';

@Module({
  imports: [SupabaseModule],
  controllers: [MerchantAuthController],
  providers: [MerchantAuthService, MerchantJwtGuard, MerchantVerifiedGuard],
  exports: [MerchantAuthService, MerchantJwtGuard, MerchantVerifiedGuard],
})
export class MerchantAuthModule {}
