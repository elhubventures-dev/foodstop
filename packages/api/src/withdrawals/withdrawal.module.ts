import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { AppConfig } from '../config/configuration';
import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { InternalAuthGuard } from '../commission/internal-auth.guard';
import { InternalWithdrawalsController } from './internal-withdrawals.controller';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';

@Module({
  imports: [SupabaseModule, NotificationsModule, MerchantAuthModule],
  controllers: [
    WithdrawalController,
    PaystackWebhookController,
    InternalWithdrawalsController,
  ],
  providers: [
    WithdrawalService,
    InternalAuthGuard,
    {
      provide: 'MERCHANT_REDIS',
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const url = config.get('redis.url', { infer: true });
        return new Redis(url, {
          maxRetriesPerRequest: 5,
          connectTimeout: 10_000,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [WithdrawalService],
})
export class WithdrawalModule {}
