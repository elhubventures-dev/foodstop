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
import { InviteTeamMemberDto, PatchTeamMemberDto } from './dto/team.dto';
import { MerchantTeamService } from './merchant-team.service';

@Controller('merchant/team')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantTeamController {
  constructor(private readonly team: MerchantTeamService) {}

  @Get('members')
  list(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.team.listMembers(req.merchant.merchantId);
  }

  @Post('invites')
  invite(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: InviteTeamMemberDto,
  ): Promise<unknown> {
    return this.team.invite(req.merchant.merchantId, dto);
  }

  @Patch('members/:id')
  patch(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchTeamMemberDto,
  ): Promise<unknown> {
    return this.team.patchMember(req.merchant.merchantId, id, dto);
  }

  @Delete('members/:id')
  remove(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.team.removeMember(req.merchant.merchantId, id);
  }
}
