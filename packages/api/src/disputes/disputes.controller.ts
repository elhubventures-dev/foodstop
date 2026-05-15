import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DisputesService } from './disputes.service';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { InternalAuthGuard } from '../commission/internal-auth.guard';

@Controller('internal/disputes')
@UseGuards(InternalAuthGuard)
export class DisputesController {
  private readonly logger = new Logger(DisputesController.name);

  constructor(private readonly disputes: DisputesService) {}

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  async open(@Body() dto: OpenDisputeDto): Promise<unknown> {
    this.logger.log(`Open dispute → order=${dto.orderId} reason=${dto.reason}`);
    return this.disputes.openDispute(dto);
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(@Body() dto: ResolveDisputeDto): Promise<unknown> {
    this.logger.log(
      `Resolve dispute → id=${dto.disputeId} outcome=${dto.outcome}`,
    );
    return this.disputes.resolveDispute(dto);
  }
}
