# Reference 04 — Wallet & Payouts Full Implementation

## Wallet Service (packages/api/src/services/wallet.service.ts)

```typescript
export class WalletService {

  // Credit merchant wallet (called by commission engine after delivery)
  async creditPending(merchantId: string, amount: number, orderId: string, ref: string) {
    return await db.transaction(async (trx) => {
      const wallet = await trx('merchant_wallets')
        .where({ merchant_id: merchantId })
        .forUpdate()   // row-level lock prevents race conditions
        .first();

      if (!wallet) throw new Error(`No wallet found for merchant ${merchantId}`);

      await trx('merchant_wallets')
        .where({ merchant_id: merchantId })
        .increment({ pending_balance: amount, total_earned: amount });

      const txRef = ref || `WTX-${Date.now()}-${merchantId.slice(0,8)}`;
      await trx('merchant_wallet_transactions').insert({
        merchant_id: merchantId,
        type: 'credit',
        amount,
        net_amount: amount,
        reference: txRef,
        order_id: orderId,
        status: 'pending',
        description: `Order #${orderId} delivered — awaiting release`,
      });

      return { success: true, reference: txRef };
    });
  }

  // Release pending → available (after hold period / dispute resolved)
  async releasePending(merchantId: string, orderId: string, amount: number) {
    return await db.transaction(async (trx) => {
      await trx('merchant_wallets')
        .where({ merchant_id: merchantId })
        .forUpdate()
        .decrement('pending_balance', amount)
        .increment('available_balance', amount);

      await trx('merchant_wallet_transactions')
        .where({ merchant_id: merchantId, order_id: orderId, type: 'credit', status: 'pending' })
        .update({ status: 'completed' });

      await trx('platform_commission_ledger')
        .where({ order_id: orderId })
        .update({ released_at: new Date() });
    });
  }

  // Debit merchant wallet (withdrawal or refund deduction)
  async debit(merchantId: string, amount: number, type: string, ref: string, description: string) {
    return await db.transaction(async (trx) => {
      const wallet = await trx('merchant_wallets')
        .where({ merchant_id: merchantId })
        .forUpdate()
        .first();

      if (wallet.available_balance < amount) {
        throw new InsufficientBalanceError(`Available: ₦${wallet.available_balance}, Requested: ₦${amount}`);
      }

      await trx('merchant_wallets')
        .where({ merchant_id: merchantId })
        .decrement('available_balance', amount)
        .increment('total_withdrawn', type === 'withdrawal' ? amount : 0);

      await trx('merchant_wallet_transactions').insert({
        merchant_id: merchantId,
        type,
        amount,
        net_amount: -amount,
        reference: ref,
        description,
        status: 'completed',
      });
    });
  }

  // Restore balance after failed withdrawal
  async restoreAfterFailedWithdrawal(merchantId: string, amount: number, withdrawalId: string) {
    return await db.transaction(async (trx) => {
      await trx('merchant_wallets')
        .where({ merchant_id: merchantId })
        .increment('available_balance', amount)
        .decrement('total_withdrawn', amount);

      await trx('merchant_wallet_transactions').insert({
        merchant_id: merchantId,
        type: 'debit',
        amount,
        net_amount: amount,
        withdrawal_id: withdrawalId,
        description: 'Withdrawal failed — balance restored',
        status: 'reversed',
      });
    });
  }

  // Manual admin adjustment
  async adminAdjust(merchantId: string, amount: number, isCredit: boolean,
                    adminId: string, reason: string) {
    const type = isCredit ? 'manual_credit' : 'manual_debit';
    const absAmount = Math.abs(amount);

    return await db.transaction(async (trx) => {
      if (isCredit) {
        await trx('merchant_wallets')
          .where({ merchant_id: merchantId })
          .increment({ available_balance: absAmount, total_earned: absAmount });
      } else {
        const wallet = await trx('merchant_wallets')
          .where({ merchant_id: merchantId }).forUpdate().first();
        if (wallet.available_balance < absAmount) throw new InsufficientBalanceError();
        await trx('merchant_wallets')
          .where({ merchant_id: merchantId })
          .decrement('available_balance', absAmount);
      }

      await trx('merchant_wallet_transactions').insert({
        merchant_id: merchantId,
        type,
        amount: absAmount,
        net_amount: isCredit ? absAmount : -absAmount,
        reference: `ADJ-${Date.now()}`,
        description: `Admin adjustment by ${adminId}: ${reason}`,
        status: 'completed',
      });

      // Audit log
      await trx('audit_logs').insert({
        actor_id: adminId,
        action: 'merchant_wallet_adjustment',
        target_type: 'merchant',
        target_id: merchantId,
        metadata: { amount: absAmount, type, reason },
      });
    });
  }
}
```

---

## Withdrawal Service (packages/api/src/services/withdrawal.service.ts)

```typescript
import Paystack from 'paystack-node'; // or raw axios to Paystack API
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

export class WithdrawalService {

  // Step 1: Validate and initiate withdrawal request
  async requestWithdrawal(merchantId: string, amount: number, bankAccountId: string) {
    const MIN_AMOUNT = 1000;
    const ADMIN_APPROVAL_THRESHOLD = 500000; // ₦500k+ requires admin approval

    if (amount < MIN_AMOUNT) throw new ValidationError(`Minimum withdrawal is ₦${MIN_AMOUNT}`);

    const wallet = await db('merchant_wallets').where({ merchant_id: merchantId }).first();
    if (wallet.available_balance < amount) throw new InsufficientBalanceError();

    const bankAccount = await db('merchant_bank_accounts')
      .where({ id: bankAccountId, merchant_id: merchantId }).first();
    if (!bankAccount) throw new NotFoundError('Bank account not found');

    // Deduct from wallet immediately (optimistic lock)
    await walletService.debit(merchantId, amount, 'withdrawal',
      `WD-${Date.now()}`, `Withdrawal to ${bankAccount.bank_name}`);

    const withdrawal = await db('merchant_withdrawals').insert({
      merchant_id: merchantId,
      amount,
      bank_name: bankAccount.bank_name,
      bank_code: bankAccount.bank_code,
      account_number: bankAccount.account_number,
      account_name: bankAccount.account_name,
      paystack_recipient_code: bankAccount.paystack_recipient_code,
      status: 'pending',
      admin_approved: amount < ADMIN_APPROVAL_THRESHOLD, // auto-approve below threshold
    }).returning('*');

    return withdrawal[0];
  }

  // Step 2: After OTP verified — initiate Paystack transfer
  async processWithdrawal(withdrawalId: string) {
    const withdrawal = await db('merchant_withdrawals').where({ id: withdrawalId }).first();
    if (withdrawal.status !== 'pending') throw new Error('Invalid withdrawal status');

    let recipientCode = withdrawal.paystack_recipient_code;

    // Create Paystack recipient if not cached
    if (!recipientCode) {
      const recipient = await paystack.transfer.createRecipient({
        type: 'nuban',
        name: withdrawal.account_name,
        account_number: withdrawal.account_number,
        bank_code: withdrawal.bank_code,
        currency: 'NGN',
      });
      recipientCode = recipient.data.recipient_code;

      // Cache on bank account
      await db('merchant_bank_accounts')
        .where({ merchant_id: withdrawal.merchant_id, account_number: withdrawal.account_number })
        .update({ paystack_recipient_code: recipientCode });
    }

    // Initiate transfer
    const transfer = await paystack.transfer.initiate({
      source: 'balance',
      amount: withdrawal.amount * 100, // Paystack uses kobo
      recipient: recipientCode,
      reason: `ChopFast merchant payout - ${withdrawal.merchant_id}`,
      reference: `CHOP-WD-${withdrawalId}`,
    });

    await db('merchant_withdrawals').where({ id: withdrawalId }).update({
      status: 'processing',
      paystack_recipient_code: recipientCode,
      paystack_transfer_code: transfer.data.transfer_code,
      paystack_transfer_ref: transfer.data.reference,
    });

    return transfer.data;
  }

  // Webhook: transfer.success
  async handleTransferSuccess(transferCode: string) {
    const withdrawal = await db('merchant_withdrawals')
      .where({ paystack_transfer_code: transferCode }).first();
    if (!withdrawal) return; // not our transfer

    await db('merchant_withdrawals').where({ id: withdrawal.id }).update({
      status: 'completed',
      processed_at: new Date(),
    });

    await db('merchant_wallets')
      .where({ merchant_id: withdrawal.merchant_id })
      .increment('total_withdrawn', withdrawal.amount);

    // Notify merchant
    await notifyMerchant(withdrawal.merchant_id, 'payout_success', {
      amount: withdrawal.amount,
      bankName: withdrawal.bank_name,
      accountName: withdrawal.account_name,
    });

    // SMS
    const merchant = await getMerchantById(withdrawal.merchant_id);
    await sendSMS(merchant.business_phone,
      `✅ ChopFast Payout: ₦${formatNaira(withdrawal.amount)} has been sent to your ${withdrawal.bank_name} account. Ref: CHOP-WD-${withdrawal.id.slice(0,8)}`
    );
  }

  // Webhook: transfer.failed
  async handleTransferFailed(transferCode: string, reason: string) {
    const withdrawal = await db('merchant_withdrawals')
      .where({ paystack_transfer_code: transferCode }).first();
    if (!withdrawal) return;

    await db.transaction(async (trx) => {
      await trx('merchant_withdrawals').where({ id: withdrawal.id }).update({
        status: 'failed',
        failure_reason: reason,
        processed_at: new Date(),
      });

      // Restore wallet balance
      await walletService.restoreAfterFailedWithdrawal(
        withdrawal.merchant_id, withdrawal.amount, withdrawal.id
      );
    });

    await notifyMerchant(withdrawal.merchant_id, 'payout_failed', {
      amount: withdrawal.amount,
      reason,
    });

    const merchant = await getMerchantById(withdrawal.merchant_id);
    await sendSMS(merchant.business_phone,
      `❌ ChopFast Payout Failed: Your withdrawal of ₦${formatNaira(withdrawal.amount)} could not be processed. Reason: ${reason}. Your balance has been restored. Please try again or contact support.`
    );
  }
}
```

---

## Paystack Webhook Handler (extended)

```typescript
// packages/api/src/webhooks/paystack.webhook.ts

router.post('/webhooks/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body).digest('hex');

  if (hash !== signature) return res.status(401).send('Invalid signature');

  const event = JSON.parse(req.body);
  res.sendStatus(200); // Always respond 200 first, process async

  switch (event.event) {
    case 'charge.success':
      await handlePaymentSuccess(event.data);
      break;

    case 'transfer.success':
      await withdrawalService.handleTransferSuccess(event.data.transfer_code);
      break;

    case 'transfer.failed':
      await withdrawalService.handleTransferFailed(
        event.data.transfer_code,
        event.data.failures?.[0]?.reason || 'Unknown error'
      );
      break;

    case 'transfer.reversed':
      await withdrawalService.handleTransferFailed(
        event.data.transfer_code, 'Transfer reversed by bank'
      );
      break;
  }
});
```

---

## Batch Payout (Super Admin)

```typescript
// Super admin triggers batch processing of all pending withdrawals
async function processBatchPayouts(adminId: string) {
  const pending = await db('merchant_withdrawals')
    .where({ status: 'pending', admin_approved: true })
    .orderBy('initiated_at', 'asc')
    .limit(100); // Paystack transfer rate limit: 120/min

  const results = { processed: 0, failed: 0, skipped: 0 };

  for (const withdrawal of pending) {
    try {
      await withdrawalService.processWithdrawal(withdrawal.id);
      results.processed++;
      await sleep(600); // ~100/min to stay within Paystack limits
    } catch (err) {
      results.failed++;
      logger.error(`Batch payout failed for ${withdrawal.id}:`, err);
    }
  }

  await auditLog(adminId, 'batch_payout_triggered', results);
  return results;
}
```

---

## Paystack Account Resolve (for bank account verification)

```typescript
// Called during bank account add — verifies account exists
async function resolveAccountNumber(accountNumber: string, bankCode: string) {
  const response = await axios.get('https://api.paystack.co/bank/resolve', {
    params: { account_number: accountNumber, bank_code: bankCode },
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });

  if (!response.data.status) throw new Error('Account not found');

  return {
    accountName: response.data.data.account_name,
    accountNumber: response.data.data.account_number,
  };
}
```

---

## OTP Gate for Withdrawals

```typescript
// POST /merchant/withdrawals/send-otp
async function sendWithdrawalOTP(merchantId: string) {
  const merchant = await getMerchantById(merchantId);
  const otp = generateOTP(6);
  const key = `withdrawal_otp:${merchantId}`;

  await redis.setex(key, 600, otp); // expires in 10 minutes
  await sendSMS(merchant.business_phone,
    `Your ChopFast withdrawal OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`
  );
}

// POST /merchant/withdrawals/verify-otp
async function verifyWithdrawalOTP(merchantId: string, otp: string) {
  const key = `withdrawal_otp:${merchantId}`;
  const attemptsKey = `withdrawal_otp_attempts:${merchantId}`;

  const attempts = parseInt(await redis.get(attemptsKey) || '0');
  if (attempts >= 3) throw new Error('Too many attempts. Request a new OTP.');

  const stored = await redis.get(key);
  if (!stored || stored !== otp) {
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, 600);
    throw new Error('Invalid OTP');
  }

  await redis.del(key);
  await redis.del(attemptsKey);
  return { verified: true };
}
```

---

## Refund Deduction from Merchant Wallet

```typescript
// When super admin resolves dispute in customer's favour:
async function processRefundDeduction(orderId: string, refundAmount: number, adminId: string) {
  const order = await getOrderById(orderId);
  const commissionEntry = await db('platform_commission_ledger')
    .where({ order_id: orderId }).first();

  // Calculate merchant's share of refund (they return their net, platform returns commission)
  const merchantDeduction = refundAmount * (1 - commissionEntry.commission_rate);
  const platformDeduction = refundAmount * commissionEntry.commission_rate;

  await walletService.debit(
    order.merchantId, merchantDeduction, 'refund_deduction',
    `RFD-${orderId}`, `Refund deduction for order #${order.reference}`
  );

  // Reverse commission credit (platform gives back their 15% too)
  await db('platform_commission_ledger')
    .where({ order_id: orderId })
    .update({ refunded: true, refund_amount: refundAmount });

  await notifyMerchant(order.merchantId, 'refund_deduction', {
    orderId, refundAmount, merchantDeduction,
  });
}
```
