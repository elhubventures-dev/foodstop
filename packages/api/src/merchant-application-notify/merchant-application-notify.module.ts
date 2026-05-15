import { Module } from '@nestjs/common';

import { InternalAuthGuard } from '../commission/internal-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { MerchantApplicationNotifyController } from './merchant-application-notify.controller';
import { MerchantApplicationNotifyService } from './merchant-application-notify.service';

@Module({
  imports: [SupabaseModule, NotificationsModule],
  controllers: [MerchantApplicationNotifyController],
  providers: [MerchantApplicationNotifyService, InternalAuthGuard],
})
export class MerchantApplicationNotifyModule {}
