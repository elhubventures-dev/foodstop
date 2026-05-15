import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import { WalletService } from './wallet.service';

@Controller('merchant/wallet')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantWalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  summary(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<Record<string, unknown>> {
    return this.wallet.getWalletSummary(req.merchant.merchantId);
  }

  @Get('transactions')
  transactions(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ): Promise<{ items: unknown[]; limit: number; offset: number }> {
    const limit =
      limitRaw != null && limitRaw !== '' ? Number(limitRaw) : 50;
    const offset =
      offsetRaw != null && offsetRaw !== '' ? Number(offsetRaw) : 0;
    const safeLimit = Number.isFinite(limit) ? limit : 50;
    const safeOffset = Number.isFinite(offset) ? offset : 0;
    return this.wallet.listTransactions(
      req.merchant.merchantId,
      safeLimit,
      safeOffset,
    );
  }
}
