import { join } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { configuration } from './config/configuration';
import { SupabaseModule } from './supabase/supabase.module';
import { CommissionModule } from './commission/commission.module';
import { DisputesModule } from './disputes/disputes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MerchantRegistrationModule } from './merchant-registration/merchant-registration.module';
import { MerchantAuthModule } from './merchant-auth/merchant-auth.module';
import { MerchantApplicationNotifyModule } from './merchant-application-notify/merchant-application-notify.module';
import { MerchantOperationsModule } from './merchant-operations/merchant-operations.module';
import { WalletModule } from './wallet/wallet.module';
import { WithdrawalModule } from './withdrawals/withdrawal.module';
import { CheckoutModule } from './checkout/checkout.module';

/** `dist/` at runtime → parent is `packages/api/`; three levels up is monorepo root. */
const apiPackageDir = join(__dirname, '..');
const monorepoRoot = join(__dirname, '..', '..', '..');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Load shared app env first, then package/local env.
      // With dotenv semantics, first value wins; this avoids placeholder Supabase vars in packages/api/.env
      // shadowing real values from apps/*/.env.local.
      // Paths are anchored to this file so `npm run start:dev` works from repo root or packages/api.
      envFilePath: [
        join(monorepoRoot, 'apps', 'admin', '.env.local'),
        join(monorepoRoot, 'apps', 'web', '.env.local'),
        join(apiPackageDir, '.env'),
        join(process.cwd(), '.env'),
      ],
      load: [configuration],
    }),
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),
    BullModule.forRootAsync({
      useFactory: () => {
        const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
        const parsed = new URL(url);
        return {
          connection: {
            host: parsed.hostname,
            port: Number(parsed.port || 6379),
            password: parsed.password || undefined,
            username: parsed.username || undefined,
          },
        };
      },
    }),
    SupabaseModule,
    NotificationsModule,
    DisputesModule,
    CommissionModule,
    MerchantRegistrationModule,
    MerchantAuthModule,
    MerchantApplicationNotifyModule,
    MerchantOperationsModule,
    WalletModule,
    WithdrawalModule,
    CheckoutModule,
  ],
})
export class AppModule {}
