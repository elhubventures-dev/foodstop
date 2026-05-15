import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { PatchOrderStatusDto } from './dto/orders.dto';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import { MerchantOrdersService } from './merchant-orders.service';

@Controller('merchant/orders')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantOrdersController {
  constructor(private readonly orders: MerchantOrdersService) {}

  @Get()
  list(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Query('limit') limitRaw?: string,
    @Query('expand') expand?: string,
  ): Promise<unknown[]> {
    const parsed = limitRaw != null && limitRaw !== '' ? Number(limitRaw) : 100;
    const limit = Number.isFinite(parsed)
      ? Math.min(200, Math.max(1, Math.floor(parsed)))
      : 100;
    return this.orders.listOrders(
      req.merchant.merchantId,
      limit,
      expand === 'items',
    );
  }

  @Get('disputes')
  listDisputes(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.orders.listDisputes(req.merchant.merchantId);
  }

  @Get(':id')
  getOne(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<unknown> {
    return this.orders.getOrder(req.merchant.merchantId, id);
  }

  @Patch(':id/status')
  patchStatus(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchOrderStatusDto,
  ): Promise<unknown> {
    return this.orders.patchOrderStatus(req.merchant.merchantId, id, dto);
  }
}
