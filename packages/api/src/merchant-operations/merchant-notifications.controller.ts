import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantNotificationsService } from '../notifications/merchant-notifications.service';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';

@Controller('merchant/notifications')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantNotificationsController {
  constructor(private readonly inbox: MerchantNotificationsService) {}

  @Get()
  list(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Query('limit') limitRaw?: string,
    @Query('unread_only') unreadRaw?: string,
  ): Promise<unknown[]> {
    const parsed =
      limitRaw != null && limitRaw !== '' ? Number(limitRaw) : 50;
    const limit = Number.isFinite(parsed)
      ? Math.min(200, Math.max(1, Math.floor(parsed)))
      : 50;
    const unreadOnly =
      unreadRaw === '1' ||
      unreadRaw === 'true' ||
      unreadRaw === 'yes';
    return this.inbox.listInbox(req.merchant.merchantId, {
      limit,
      unreadOnly,
    });
  }

  @Post('read-all')
  markAllRead(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<{ ok: true }> {
    return this.inbox.markAllRead(req.merchant.merchantId).then(() => ({ ok: true as const }));
  }

  @Post(':id/read')
  markRead(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ ok: true }> {
    return this.inbox
      .markRead(req.merchant.merchantId, id)
      .then(() => ({ ok: true as const }));
  }
}
