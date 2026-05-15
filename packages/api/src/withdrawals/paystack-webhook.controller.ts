import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

import type { AppConfig } from '../config/configuration';
import { WithdrawalService } from './withdrawal.service';

interface PaystackEvent {
  event: string;
  data: Record<string, unknown> & {
    transfer_code?: string;
    reference?: string;
    failures?: { reason?: string }[];
  };
}

/**
 * Paystack transfer webhooks. Configure URL in Paystack dashboard:
 * POST /api/v1/webhooks/paystack
 *
 * Requires `rawBody: true` in NestFactory (see main.ts) so HMAC verification works.
 */
@Controller('webhooks')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly withdrawals: WithdrawalService,
  ) {}

  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  async handlePaystack(@Req() req: Request): Promise<{ received: boolean }> {
    const secret = this.config.get('paystack.secretKey', { infer: true });
    if (!secret) {
      throw new UnauthorizedException('Paystack not configured.');
    }

    const signature = req.headers['x-paystack-signature'];
    if (typeof signature !== 'string') {
      throw new UnauthorizedException('Missing Paystack signature.');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      this.logger.error(
        'Paystack webhook: rawBody missing. Ensure NestFactory uses rawBody: true.',
      );
      throw new UnauthorizedException('Invalid request body.');
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (!timingSafeEqualStr(hash, signature)) {
      this.logger.warn('Paystack webhook signature mismatch.');
      throw new UnauthorizedException('Invalid signature.');
    }

    let event: PaystackEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as PaystackEvent;
    } catch {
      throw new UnauthorizedException('Invalid JSON.');
    }

    this.logger.log(`Paystack event: ${event.event}`);

    try {
      await this.dispatch(event);
    } catch (err) {
      this.logger.error(
        `Paystack webhook handler error: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }

    return { received: true };
  }

  private async dispatch(event: PaystackEvent): Promise<void> {
    const data = event.data;

    switch (event.event) {
      case 'transfer.success':
        if (data.transfer_code) {
          await this.withdrawals.handleTransferSuccess({
            transferCode: data.transfer_code,
            reference: data.reference as string | undefined,
          });
        }
        break;

      case 'transfer.failed':
        if (data.transfer_code) {
          const reason =
            data.failures?.[0]?.reason ??
            (data as { message?: string }).message ??
            'Transfer failed';
          await this.withdrawals.handleTransferFailed({
            transferCode: data.transfer_code,
            reason,
          });
        }
        break;

      case 'transfer.reversed':
        if (data.transfer_code) {
          await this.withdrawals.handleTransferFailed({
            transferCode: data.transfer_code,
            reason: 'Transfer reversed by bank or Paystack',
          });
        }
        break;

      default:
        break;
    }
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
