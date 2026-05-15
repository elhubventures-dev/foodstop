import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { InternalAuthGuard } from '../commission/internal-auth.guard';
import { BatchProcessWithdrawalsDto } from './dto/batch-process-withdrawals.dto';
import { WithdrawalService } from './withdrawal.service';

/**
 * Internal: super-admin batch Paystack initiation (no merchant OTP).
 * Proxied from apps/admin with CHOPFAST_INTERNAL_API_KEY.
 */
@Controller('internal/withdrawals')
@UseGuards(InternalAuthGuard)
export class InternalWithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalService) {}

  @Post('batch-process')
  @HttpCode(HttpStatus.OK)
  batchProcess(@Body() dto: BatchProcessWithdrawalsDto) {
    return this.withdrawals.processBatchWithdrawalsSystem({
      ids: dto.ids,
      limit: dto.limit,
      delayMs: dto.delayMs,
    });
  }
}
