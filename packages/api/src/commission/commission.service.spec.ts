import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';

import { CommissionService } from './commission.service';
import { SupabaseService } from '../supabase/supabase.service';
import { MerchantNotificationsService } from '../notifications/merchant-notifications.service';
import {
  RELEASE_PENDING_QUEUE,
  RELEASE_PENDING_JOB_NAME,
} from './commission.types';
describe('CommissionService', () => {
  let service: CommissionService;
  let rpcMock: jest.Mock;
  let releaseQueue: { remove: jest.Mock; add: jest.Mock };

  const merchantId = '11111111-1111-1111-1111-111111111111';
  const orderId = '22222222-2222-2222-2222-222222222222';

  const orderRow = {
    id: orderId,
    user_id: null,
    merchant_id: merchantId,
    status: 'delivered',
    subtotal: 10_000,
    delivery_fee: 500,
    tax: 750,
    discount: 0,
    total: 11_250,
    paystack_reference: 'PSK_TEST',
  };

  let merchantRow = {
    id: merchantId,
    business_name: 'Test Kitchen',
    commission_rate: 0.15,
    is_suspended: false,
  };

  function mockFrom(table: string) {
    const data =
      table === 'orders'
        ? orderRow
        : table === 'merchants'
          ? merchantRow
          : null;
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data, error: null }),
    };
  }

  beforeEach(async () => {
    merchantRow = {
      id: merchantId,
      business_name: 'Test Kitchen',
      commission_rate: 0.15,
      is_suspended: false,
    };
    rpcMock = jest.fn().mockResolvedValue({
      data: [
        {
          ledger_id: '33333333-3333-3333-3333-333333333333',
          commission_amt: 1500,
          vat_amount: 750,
          merchant_net: 8500,
          was_idempotent: false,
        },
      ],
      error: null,
    });

    releaseQueue = {
      remove: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
    };

    const supabase = {
      db: {
        from: jest.fn((t: string) => mockFrom(t)),
        rpc: rpcMock,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: SupabaseService, useValue: supabase },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'commission.defaultRate') return 0.15;
              if (key === 'commission.vatRate') return 0.075;
              if (key === 'commission.pendingHoldHours') return 2;
              return undefined;
            }),
          },
        },
        {
          provide: MerchantNotificationsService,
          useValue: { notify: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: getQueueToken(RELEASE_PENDING_QUEUE),
          useValue: releaseQueue,
        },
      ],
    }).compile();

    service = module.get(CommissionService);
  });

  it('passes food subtotal (not grand total) to credit RPC — delivery & tax excluded from commission base', async () => {
    await service.processOrderCommission(orderId);

    expect(rpcMock).toHaveBeenCalledWith('credit_merchant_for_delivered_order', {
      p_order_id: orderId,
      p_merchant_id: merchantId,
      p_food_subtotal: 10_000,
      p_grand_total: 11_250,
      p_commission_rate: 0.15,
      p_vat_rate: 0.075,
      p_order_reference: 'PSK_TEST',
    });
  });

  it('uses merchant commission_rate 0.11 when set (Gold tier)', async () => {
    merchantRow.commission_rate = 0.11;
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          ledger_id: '33333333-3333-3333-3333-333333333333',
          commission_amt: 1100,
          vat_amount: 750,
          merchant_net: 8900,
          was_idempotent: false,
        },
      ],
      error: null,
    });

    await service.processOrderCommission(orderId);

    expect(rpcMock).toHaveBeenCalledWith(
      'credit_merchant_for_delivered_order',
      expect.objectContaining({
        p_food_subtotal: 10_000,
        p_commission_rate: 0.11,
      }),
    );
    merchantRow.commission_rate = 0.15;
  });

  it('schedules BullMQ release job after successful credit', async () => {
    await service.processOrderCommission(orderId);
    expect(releaseQueue.remove).toHaveBeenCalled();
    expect(releaseQueue.add).toHaveBeenCalledWith(
      RELEASE_PENDING_JOB_NAME,
      expect.objectContaining({
        orderId,
        merchantId,
        amount: 8500,
      }),
      expect.objectContaining({ jobId: `release:${orderId}` }),
    );
  });

  it('throws when order is not delivered', async () => {
    const pendingOrder = { ...orderRow, status: 'pending' };
    const supabase = {
      db: {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: pendingOrder, error: null }),
        })),
        rpc: rpcMock,
      },
    };

    const mod = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: SupabaseService, useValue: supabase },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'commission.defaultRate') return 0.15;
              if (key === 'commission.vatRate') return 0.075;
              if (key === 'commission.pendingHoldHours') return 2;
              return undefined;
            }),
          },
        },
        {
          provide: MerchantNotificationsService,
          useValue: { notify: jest.fn() },
        },
        {
          provide: getQueueToken(RELEASE_PENDING_QUEUE),
          useValue: releaseQueue,
        },
      ],
    }).compile();

    const svc = mod.get(CommissionService);
    await expect(svc.processOrderCommission(orderId)).rejects.toThrow(
      /not delivered/,
    );
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
