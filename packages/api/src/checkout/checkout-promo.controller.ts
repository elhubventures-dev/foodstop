import { Body, Controller, Post } from '@nestjs/common';

import { ValidatePromoDto } from './dto/validate-promo.dto';
import { CheckoutPromoService } from './checkout-promo.service';

/**
 * Public checkout helpers (no customer JWT). Used by web + mobile before Paystack.
 */
@Controller('checkout')
export class CheckoutPromoController {
  constructor(private readonly promo: CheckoutPromoService) {}

  @Post('validate-promo')
  validate(@Body() dto: ValidatePromoDto) {
    return this.promo.validate(dto);
  }
}
