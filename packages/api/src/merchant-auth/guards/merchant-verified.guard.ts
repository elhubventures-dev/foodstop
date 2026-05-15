import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { SupabaseService } from '../../supabase/supabase.service';
import type { MerchantJwtPayload } from './merchant-jwt.guard';

/**
 * After {@link MerchantJwtGuard}: ensures the merchant row is active, verified,
 * and not suspended (KYC-approved tenant).
 */
@Injectable()
export class MerchantVerifiedGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { merchant?: MerchantJwtPayload }>();
    const m = req.merchant;
    if (!m?.merchantId) {
      throw new UnauthorizedException('Missing merchant context.');
    }

    const { data, error } = await this.supabase.db
      .from('merchants')
      .select('id, is_verified, is_active, is_suspended')
      .eq('id', m.merchantId)
      .maybeSingle();

    if (error || !data) {
      throw new ForbiddenException('Merchant not found.');
    }
    if (data.is_suspended === true) {
      throw new ForbiddenException('Merchant account is suspended.');
    }
    if (data.is_verified !== true || data.is_active !== true) {
      throw new ForbiddenException(
        'Merchant account is not active or verified yet.',
      );
    }
    return true;
  }
}
