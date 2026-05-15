import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { CommissionService } from './commission.service';
import { TriggerCommissionDto } from './dto/trigger-commission.dto';
import { InternalAuthGuard } from './internal-auth.guard';
import type { CommissionResult } from './commission.types';

export const ORDER_DELIVERED_EVENT = 'order.delivered';

export interface OrderDeliveredEvent {
  orderId: string;
}

@Controller('internal/commission')
@UseGuards(InternalAuthGuard)
export class CommissionController {
  private readonly logger = new Logger(CommissionController.name);

  constructor(private readonly commission: CommissionService) {}

  /**
   * Webhook called by the order-service whenever an order transitions to
   * status='delivered'. Idempotent — safe to call more than once for the
   * same order (RPC enforces unique ledger row per order_id).
   */
  @Post('orders/delivered')
  @HttpCode(HttpStatus.OK)
  async onOrderDelivered(
    @Body() body: TriggerCommissionDto,
  ): Promise<CommissionResult> {
    this.logger.log(`Webhook order.delivered → orderId=${body.orderId}`);
    return this.commission.processOrderCommission(body.orderId);
  }

  /**
   * Internal NestJS event listener — same trigger as the webhook above for
   * any in-process emitter (e.g. an OrdersService inside this monolith).
   */
  @OnEvent(ORDER_DELIVERED_EVENT, { async: true, promisify: true })
  async handleOrderDeliveredEvent(payload: OrderDeliveredEvent): Promise<void> {
    try {
      await this.commission.processOrderCommission(payload.orderId);
    } catch (err) {
      this.logger.error(
        `Commission failed for order=${payload.orderId}: ${(err as Error).message}`,
      );
    }
  }
}
