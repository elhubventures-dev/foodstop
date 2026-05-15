import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import type { AppConfig } from '../../config/configuration';

/** Claims issued by POST /merchant/auth/login (HS256, MERCHANT_JWT_SECRET). */
export interface MerchantJwtPayload {
  merchantId: string;
  userId?: string;
  sub?: string;
  role: string;
  /** Merchant row is_verified (KYC approved). */
  verified?: boolean;
  /** Merchant row is_active. */
  active?: boolean;
}

@Injectable()
export class MerchantJwtGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get('merchantAuth.jwtSecret', { infer: true });
    if (!secret) {
      throw new UnauthorizedException(
        'MERCHANT_JWT_SECRET is not configured on the server.',
      );
    }

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const token =
      header?.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token.');
    }

    try {
      const payload = jwt.verify(token, secret) as MerchantJwtPayload;
      if (payload.role !== 'merchant' || !payload.merchantId) {
        throw new ForbiddenException('Invalid merchant token scope.');
      }
      (req as Request & { merchant: MerchantJwtPayload }).merchant = payload;
      return true;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid or expired merchant token.');
    }
  }
}
