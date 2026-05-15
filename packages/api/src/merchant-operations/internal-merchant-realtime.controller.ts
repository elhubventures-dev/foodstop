import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { InternalAuthGuard } from '../commission/internal-auth.guard';
import { EmitNewOrderDto } from './dto/emit-new-order.dto';
import { MerchantRealtimeBridge } from './merchant-realtime.bridge';

/**
 * Push a `new_order` event to connected `/merchant` Socket.IO clients.
 * Call from your order pipeline (server-side) after `orders.merchant_id` is set.
 * POST /api/v1/internal/merchant-realtime/emit-new-order
 */
@Controller('internal/merchant-realtime')
@UseGuards(InternalAuthGuard)
export class InternalMerchantRealtimeController {
  constructor(private readonly bridge: MerchantRealtimeBridge) {}

  @Post('emit-new-order')
  @HttpCode(HttpStatus.OK)
  emitNewOrder(@Body() dto: EmitNewOrderDto): { ok: boolean } {
    this.bridge.emitNewOrder(dto.merchant_id, dto.order);
    return { ok: true };
  }
}
