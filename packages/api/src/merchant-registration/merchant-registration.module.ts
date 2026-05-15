import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { AppConfig } from '../config/configuration';
import { SupabaseModule } from '../supabase/supabase.module';
import { MerchantRegistrationController } from './merchant-registration.controller';
import { MerchantRegistrationService } from './merchant-registration.service';

@Module({
  imports: [SupabaseModule],
  controllers: [MerchantRegistrationController],
  providers: [
    {
      provide: 'MERCHANT_REDIS',
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const url = config.get('redis.url', { infer: true });
        // Do not use maxRetriesPerRequest: null here — that retries forever when Redis is down,
        // which hangs POST /merchant/register at redis.get() (OTP verify) indefinitely.
        return new Redis(url, {
          maxRetriesPerRequest: 5,
          connectTimeout: 10_000,
        });
      },
      inject: [ConfigService],
    },
    MerchantRegistrationService,
  ],
  exports: [MerchantRegistrationService],
})
export class MerchantRegistrationModule {}
