import { Module } from '@nestjs/common';

import { InternalAuthGuard } from '../commission/internal-auth.guard';
import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { InternalMerchantRealtimeController } from './internal-merchant-realtime.controller';
import { MerchantGateway } from './merchant.gateway';
import { MerchantGrowthController } from './merchant-growth.controller';
import { MerchantGrowthService } from './merchant-growth.service';
import { MerchantMenuController } from './merchant-menu.controller';
import { MerchantMenuService } from './merchant-menu.service';
import { MerchantNotificationsController } from './merchant-notifications.controller';
import { MerchantOrdersController } from './merchant-orders.controller';
import { MerchantOrdersService } from './merchant-orders.service';
import { MerchantPromotionsController } from './merchant-promotions.controller';
import { MerchantPromotionsService } from './merchant-promotions.service';
import { MerchantRealtimeBridge } from './merchant-realtime.bridge';
import { MerchantReviewsController } from './merchant-reviews.controller';
import { MerchantReviewsService } from './merchant-reviews.service';
import { MerchantSupportController } from './merchant-support.controller';
import { MerchantSupportService } from './merchant-support.service';
import { MerchantTeamController } from './merchant-team.controller';
import { MerchantTeamService } from './merchant-team.service';

@Module({
  imports: [SupabaseModule, MerchantAuthModule, NotificationsModule],
  controllers: [
    MerchantMenuController,
    MerchantOrdersController,
    MerchantReviewsController,
    MerchantPromotionsController,
    MerchantNotificationsController,
    MerchantTeamController,
    MerchantSupportController,
    MerchantGrowthController,
    InternalMerchantRealtimeController,
  ],
  providers: [
    MerchantGrowthService,
    MerchantMenuService,
    MerchantOrdersService,
    MerchantReviewsService,
    MerchantPromotionsService,
    MerchantTeamService,
    MerchantSupportService,
    MerchantGateway,
    MerchantRealtimeBridge,
    InternalAuthGuard,
  ],
})
export class MerchantOperationsModule {}
