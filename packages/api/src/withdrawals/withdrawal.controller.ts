import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { InitiateWithdrawalDto } from './dto/initiate-withdrawal.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import { WithdrawalService } from './withdrawal.service';

@Controller('merchant/withdrawals')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class WithdrawalController {
  private readonly logger = new Logger(WithdrawalController.name);

  constructor(private readonly withdrawals: WithdrawalService) {}

  @Get()
  list(
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
    return this.withdrawals.listWithdrawals(
      req.merchant.merchantId,
      safeLimit,
      safeOffset,
    );
  }

  @Get(':withdrawalId')
  getOne(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('withdrawalId', ParseUUIDPipe) withdrawalId: string,
  ): Promise<Record<string, unknown>> {
    return this.withdrawals.getWithdrawalDetail(
      req.merchant.merchantId,
      withdrawalId,
    );
  }

  /**
   * Step 1 — debit wallet + create withdrawal row (pending).
   * Amounts ≥ WITHDRAWAL_ADMIN_THRESHOLD_NGN require admin approval before initiate.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async request(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: RequestWithdrawalDto,
  ): Promise<unknown> {
    const merchantId = req.merchant.merchantId;
    this.logger.log(`Withdrawal request merchant=${merchantId}`);
    return this.withdrawals.requestWithdrawal(merchantId, {
      bankAccountId: dto.bank_account_id,
      amount: dto.amount,
    });
  }

  /** OTP gate — Termii SMS to merchant business_phone (pin_id stored in Redis). */
  @Post(':withdrawalId/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('withdrawalId', ParseUUIDPipe) withdrawalId: string,
  ): Promise<unknown> {
    const merchantId = req.merchant.merchantId;
    return this.withdrawals.sendWithdrawalOtp(merchantId, withdrawalId);
  }

  /** Step 2 — verify OTP + Paystack Transfer (recipient + initiate). */
  @Post(':withdrawalId/initiate')
  @HttpCode(HttpStatus.OK)
  async initiate(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('withdrawalId', ParseUUIDPipe) withdrawalId: string,
    @Body() dto: InitiateWithdrawalDto,
  ): Promise<unknown> {
    const merchantId = req.merchant.merchantId;
    return this.withdrawals.initiatePaystackTransfer(
      merchantId,
      withdrawalId,
      dto.otp,
    );
  }
}
