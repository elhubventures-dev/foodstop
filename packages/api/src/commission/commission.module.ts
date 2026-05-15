import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { ReleasePendingBalanceProcessor } from './release-pending-balance.processor';
import { InternalAuthGuard } from './internal-auth.guard';
import { RELEASE_PENDING_QUEUE } from './commission.types';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: RELEASE_PENDING_QUEUE }),
    NotificationsModule,
  ],
  controllers: [CommissionController],
  providers: [
    CommissionService,
    ReleasePendingBalanceProcessor,
    InternalAuthGuard,
  ],
  exports: [CommissionService],
})
export class CommissionModule {}
