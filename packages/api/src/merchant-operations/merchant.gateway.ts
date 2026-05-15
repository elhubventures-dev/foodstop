import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';

import type { AppConfig } from '../config/configuration';
import type { MerchantJwtPayload } from '../merchant-auth/guards/merchant-jwt.guard';
import { MerchantRealtimeBridge } from './merchant-realtime.bridge';

@WebSocketGateway({
  namespace: '/merchant',
  cors: { origin: true },
})
export class MerchantGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(MerchantGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly bridge: MerchantRealtimeBridge,
  ) {}

  afterInit(): void {
    this.bridge.attachServer(this.server);
  }

  handleConnection(client: Socket): void {
    const authHeader = client.handshake.headers.authorization;
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      (typeof authHeader === 'string'
        ? authHeader.replace(/^Bearer\s+/i, '').trim()
        : undefined);
    const secret = this.config.get('merchantAuth.jwtSecret', { infer: true });
    if (!token || !secret) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = jwt.verify(token, secret) as MerchantJwtPayload;
      if (payload.role !== 'merchant' || !payload.merchantId) {
        client.disconnect(true);
        return;
      }
      void client.join(`merchant:${payload.merchantId}`);
      this.logger.debug(`merchant ws join merchant:${payload.merchantId}`);
    } catch {
      client.disconnect(true);
    }
  }
}
