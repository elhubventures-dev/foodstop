import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { InternalAuthGuard } from '../commission/internal-auth.guard';
import { NotifyMerchantApplicationDto } from './dto/notify-merchant-application.dto';
import { MerchantApplicationNotifyService } from './merchant-application-notify.service';

/**
 * Internal-only: after super-admin updates `merchants` in Supabase, call this to
 * send approval / rejection / RFI email + SMS and write `merchant_notifications`.
 * Full path: POST /api/v1/internal/merchant-applications/notify
 */
@Controller('internal/merchant-applications')
@UseGuards(InternalAuthGuard)
export class MerchantApplicationNotifyController {
  constructor(
    private readonly applicationNotify: MerchantApplicationNotifyService,
  ) {}

  @Post('notify')
  @HttpCode(HttpStatus.OK)
  async postNotify(
    @Body() dto: NotifyMerchantApplicationDto,
  ): Promise<Record<string, unknown>> {
    return this.applicationNotify.handleNotify(dto);
  }
}
