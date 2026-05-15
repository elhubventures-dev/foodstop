import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import type { AppConfig } from '../config/configuration';

/**
 * Protects internal-only endpoints (e.g. order-status webhook trigger,
 * dispute open/resolve callbacks) with a shared secret header.
 * Header: `x-internal-key: <INTERNAL_API_KEY>`.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(ctx: ExecutionContext): boolean {
    const expected = this.config.get('internalApiKey', { infer: true });
    if (!expected) {
      throw new UnauthorizedException(
        'INTERNAL_API_KEY is not configured on the server.',
      );
    }
    const req = ctx.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-internal-key'];
    if (typeof provided !== 'string' || provided !== expected) {
      throw new UnauthorizedException('Invalid internal API key.');
    }
    return true;
  }
}
