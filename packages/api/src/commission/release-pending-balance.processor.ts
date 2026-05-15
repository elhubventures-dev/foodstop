import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CommissionService } from './commission.service';
import { MerchantNotificationsService } from '../notifications/merchant-notifications.service';
import {
  RELEASE_PENDING_QUEUE,
  RELEASE_PENDING_JOB_NAME,
  ReleasePendingJobData,
} from './commission.types';

export interface ReleaseJobResult {
  released: boolean;
  reason: string;
  amount: number;
}

@Processor(RELEASE_PENDING_QUEUE)
export class ReleasePendingBalanceProcessor extends WorkerHost {
  private readonly logger = new Logger(ReleasePendingBalanceProcessor.name);

  constructor(
    private readonly commission: CommissionService,
    private readonly notifications: MerchantNotificationsService,
  ) {
    super();
  }

  async process(job: Job<ReleasePendingJobData>): Promise<ReleaseJobResult> {
    if (job.name !== RELEASE_PENDING_JOB_NAME) {
      this.logger.warn(
        `Unknown job name=${job.name} on queue ${RELEASE_PENDING_QUEUE}`,
      );
      return { released: false, reason: 'unknown_job', amount: 0 };
    }

    const { orderId, merchantId, amount } = job.data;
    this.logger.log(
      `Processing release: order=${orderId} merchant=${merchantId} amount=${amount}`,
    );

    const result = await this.commission.releasePendingForOrder(orderId);

    if (!result.released) {
      this.logger.warn(
        `Release skipped order=${orderId} reason=${result.reason} (job will be re-queued externally if a dispute resolves)`,
      );
      return result;
    }

    await this.notifications.notify(merchantId, {
      type: 'wallet_release',
      title: 'Wallet release',
      body: `₦${result.amount.toLocaleString('en-NG')} is now available for withdrawal.`,
      data: { orderId, amount: result.amount },
    });

    return result;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ReleasePendingJobData, ReleaseJobResult>): void {
    const r = job.returnvalue;
    this.logger.log(
      `Job ${job.id} completed: released=${r?.released} reason=${r?.reason} amount=${r?.amount}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ReleasePendingJobData> | undefined, err: Error): void {
    this.logger.error(
      `Job ${job?.id ?? 'unknown'} failed: ${err.message}`,
      err.stack,
    );
  }
}
