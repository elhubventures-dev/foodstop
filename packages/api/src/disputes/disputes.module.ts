import { Module } from '@nestjs/common';

import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { CommissionModule } from '../commission/commission.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InternalAuthGuard } from '../commission/internal-auth.guard';

@Module({
  imports: [CommissionModule, NotificationsModule],
  controllers: [DisputesController],
  providers: [DisputesService, InternalAuthGuard],
  exports: [DisputesService],
})
export class DisputesModule {}
