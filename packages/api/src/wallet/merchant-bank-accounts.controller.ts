import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import { WalletService } from './wallet.service';

@Controller('merchant/bank-accounts')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantBankAccountsController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  list(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.wallet.listBankAccounts(req.merchant.merchantId);
  }
}
