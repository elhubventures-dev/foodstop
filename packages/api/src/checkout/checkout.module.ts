import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { CheckoutPromoController } from './checkout-promo.controller';
import { CheckoutPromoService } from './checkout-promo.service';

@Module({
  imports: [SupabaseModule],
  controllers: [CheckoutPromoController],
  providers: [CheckoutPromoService],
  exports: [CheckoutPromoService],
})
export class CheckoutModule {}
