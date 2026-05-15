import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import {
  BookFeaturedSlotDto,
  ChatMessageDto,
  CreateMerchantLocationDto,
  MarketingAudienceDto,
  MarketingCampaignDto,
  MerchantVatRecordDto,
  ReferralInviteDto,
} from './dto/growth.dto';
import { MerchantGrowthService } from './merchant-growth.service';

@Controller('merchant/growth')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantGrowthController {
  constructor(private readonly growth: MerchantGrowthService) {}

  @Get('referrals')
  listReferrals(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listReferrals(req.merchant.merchantId);
  }

  @Post('referrals')
  inviteReferral(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: ReferralInviteDto,
  ): Promise<unknown> {
    return this.growth.inviteReferral(req.merchant.merchantId, dto);
  }

  @Get('locations')
  listLocations(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listLocations(req.merchant.merchantId);
  }

  @Post('locations')
  createLocation(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: CreateMerchantLocationDto,
  ): Promise<unknown> {
    return this.growth.createLocation(req.merchant.merchantId, dto);
  }

  @Delete('locations/:id')
  deleteLocation(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.growth.deleteLocation(req.merchant.merchantId, id);
  }

  @Get('vat-remittance')
  listVat(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listVatRemittance(req.merchant.merchantId);
  }

  @Post('vat-remittance')
  recordVat(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: MerchantVatRecordDto,
  ): Promise<unknown> {
    return this.growth.recordVatRemittance(req.merchant.merchantId, dto);
  }

  @Get('invoices/:invoiceId/html')
  async invoiceHtml(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Res() res: Response,
  ): Promise<void> {
    const html = await this.growth.getInvoiceHtml(
      req.merchant.merchantId,
      invoiceId,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('invoices')
  listInvoices(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listInvoices(req.merchant.merchantId);
  }

  @Get('featured-slots')
  listFeatured(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listFeaturedSlots(req.merchant.merchantId);
  }

  @Post('featured-slots')
  bookFeatured(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: BookFeaturedSlotDto,
  ): Promise<unknown> {
    return this.growth.bookFeaturedSlot(req.merchant.merchantId, dto);
  }

  @Get('marketing/audience')
  listAudience(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listMarketingAudience(req.merchant.merchantId);
  }

  @Post('marketing/audience')
  upsertAudience(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: MarketingAudienceDto,
  ): Promise<unknown> {
    return this.growth.upsertMarketingAudience(req.merchant.merchantId, dto);
  }

  @Get('marketing/campaigns')
  listCampaigns(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listMarketingCampaigns(req.merchant.merchantId);
  }

  @Post('marketing/campaigns')
  createCampaign(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: MarketingCampaignDto,
  ): Promise<unknown> {
    return this.growth.createMarketingCampaign(req.merchant.merchantId, dto);
  }

  @Post('marketing/campaigns/:id/send')
  sendCampaign(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.growth.sendMarketingCampaign(req.merchant.merchantId, id);
  }

  @Get('support-chat/messages')
  chatMessages(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.growth.listChatMessages(req.merchant.merchantId);
  }

  @Post('support-chat/messages')
  postChat(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: ChatMessageDto,
  ): Promise<unknown> {
    return this.growth.postChatMessage(
      req.merchant.merchantId,
      req.merchant.userId ?? req.merchant.sub,
      dto,
    );
  }
}
