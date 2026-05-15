import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import { ReplyMerchantReviewDto } from './dto/merchant-reviews.dto';
import { MerchantReviewsService } from './merchant-reviews.service';

@Controller('merchant/reviews')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantReviewsController {
  constructor(private readonly reviews: MerchantReviewsService) {}

  @Get()
  list(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.reviews.listReviews(req.merchant.merchantId);
  }

  @Patch(':id/reply')
  reply(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplyMerchantReviewDto,
  ): Promise<unknown> {
    return this.reviews.replyToReview(
      req.merchant.merchantId,
      id,
      dto.reply_text,
    );
  }
}
