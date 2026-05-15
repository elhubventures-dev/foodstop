import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';

/**
 * Bridges HTTP/internal callers to the Socket.IO `/merchant` namespace so
 * `new_order` events reach connected merchant dashboards.
 */
@Injectable()
export class MerchantRealtimeBridge {
  private readonly logger = new Logger(MerchantRealtimeBridge.name);
  private server: Server | null = null;

  attachServer(server: Server): void {
    this.server = server;
    this.logger.log('Merchant Socket.IO server attached.');
  }

  emitNewOrder(merchantId: string, order: Record<string, unknown>): void {
    if (!this.server) {
      this.logger.warn('emitNewOrder called before Socket.IO init — dropped');
      return;
    }
    this.server.to(`merchant:${merchantId}`).emit('new_order', order);
  }

  /** Live boards: same payload as skill `order_status_update` + legacy `order_updated`. */
  emitOrderUpdated(merchantId: string, order: Record<string, unknown>): void {
    if (!this.server) {
      this.logger.warn('emitOrderUpdated called before Socket.IO init — dropped');
      return;
    }
    const room = `merchant:${merchantId}`;
    const payload = { order };
    this.server.to(room).emit('order_updated', payload);
    this.server.to(room).emit('order_status_update', payload);
  }
}
