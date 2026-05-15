import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import {
  CreateMerchantPromotionDto,
  PatchMerchantPromotionDto,
} from './dto/merchant-promotions.dto';
import { MerchantPromotionsService } from './merchant-promotions.service';

@Controller('merchant/promotions')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantPromotionsController {
  constructor(private readonly promotions: MerchantPromotionsService) {}

  @Get()
  list(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.promotions.listPromotions(req.merchant.merchantId);
  }

  @Post()
  create(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: CreateMerchantPromotionDto,
  ): Promise<unknown> {
    return this.promotions.createPromotion(req.merchant.merchantId, dto);
  }

  @Patch(':id')
  patch(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchMerchantPromotionDto,
  ): Promise<unknown> {
    return this.promotions.patchPromotion(req.merchant.merchantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ ok: true }> {
    await this.promotions.deletePromotion(req.merchant.merchantId, id);
    return { ok: true };
  }
}
