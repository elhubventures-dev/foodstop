import { Module } from '@nestjs/common';
import { MerchantNotificationsService } from './merchant-notifications.service';

@Module({
  providers: [MerchantNotificationsService],
  exports: [MerchantNotificationsService],
})
export class NotificationsModule {}
