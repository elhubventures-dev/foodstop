import {
  Body,
  Controller,
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
  CreateSupportTicketDto,
  PatchSupportTicketDto,
  PostSupportMessageDto,
} from './dto/support.dto';
import { MerchantSupportService } from './merchant-support.service';

@Controller('merchant/support')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantSupportController {
  constructor(private readonly support: MerchantSupportService) {}

  @Get('tickets')
  list(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.support.listTickets(req.merchant.merchantId);
  }

  @Post('tickets')
  create(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: CreateSupportTicketDto,
  ): Promise<unknown> {
    return this.support.createTicket(
      req.merchant.merchantId,
      req.merchant.userId ?? req.merchant.sub,
      dto,
    );
  }

  @Get('tickets/:id')
  getOne(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<unknown> {
    return this.support.getTicket(req.merchant.merchantId, id);
  }

  @Post('tickets/:id/messages')
  postMessage(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostSupportMessageDto,
  ): Promise<unknown> {
    return this.support.postMessage(
      req.merchant.merchantId,
      id,
      req.merchant.userId ?? req.merchant.sub,
      dto,
    );
  }

  @Patch('tickets/:id')
  patch(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchSupportTicketDto,
  ): Promise<unknown> {
    return this.support.patchTicket(req.merchant.merchantId, id, dto);
  }
}
