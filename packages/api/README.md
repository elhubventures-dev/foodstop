# `@chopfast/api` — Commission Engine (NestJS)

Backend for the ChopFast multi-vendor marketplace. Phase 1 of the multi-vendor
skill: the **commission engine**, **wallet pending credit**, **2-hour release
job**, and **dispute hold extension**.

**Hybrid stack:** this package is the **trusted worker** (Redis / BullMQ) next to
**Postgres RPCs** and optional **Supabase Edge Functions**. Read
[`docs/hybrid-architecture.md`](../../docs/hybrid-architecture.md) before adding
new HTTP routes or duplicating commission logic in clients.

> Source of truth: `chopfast-multivendor-skill/` (read `SKILL.md` and
> `references/01-database-commission.md` before changing logic in here).

---

## What it does

When an order transitions to `status='delivered'`, the engine:

1. Looks up the order + merchant.
2. Splits the **food subtotal** (not delivery, not VAT) using
   `merchants.commission_rate` (default 15%).
3. Atomically (Postgres function `credit_merchant_for_delivered_order`):
   - inserts a row in `platform_commission_ledger`
   - credits `merchant_wallets.pending_balance` by 85% of food subtotal
   - bumps `total_earned` and `total_commission_paid`
   - inserts a `merchant_wallet_transactions` row with `status='pending'`
4. Schedules a BullMQ job `release-pending-balance` for **+2 hours**.
5. Sends a `wallet_credit` notification to the merchant.

When the release job fires:

1. Calls `release_merchant_pending_for_order` RPC.
2. The RPC refuses to release if a dispute on the order is `open` /
   `investigating` (returns `released=false, reason='dispute_open'`).
3. Otherwise atomically moves `pending_balance → available_balance`,
   completes the wallet transaction, and stamps `released_at`.

When a dispute opens:

1. `dispute_cases` row inserted (`status='open'`).
2. The scheduled BullMQ release job is **cancelled** by jobId
   (`release:<orderId>`). Funds remain in `pending_balance`.
3. Merchant gets a `dispute_opened` notification.

When a dispute resolves:

- **`resolved_no_refund` / `closed`** → re-schedule the release job with
  zero delay so funds flow through the normal release path.
- **`resolved_refund`** → call `clawback_merchant_pending_for_refund` to
  debit pending (or `available_balance` if pending is short), write a
  `refund_deduction` wallet transaction, and reverse the original credit.

---

## Architecture

```
HTTP webhook  ─┐
EventEmitter ──┼──▶ CommissionService.processOrderCommission(orderId)
               │       │
               │       ├─ RPC: credit_merchant_for_delivered_order
               │       └─ BullMQ.add('release', delay = 2h)
               │
               │      ┌──────────────────────────┐
               └────▶ │ ReleasePendingProcessor  │ ◀─── 2h later
                      └────────────┬─────────────┘
                                   │
                                   ▼
                  RPC: release_merchant_pending_for_order
                  (refuses if open dispute)

DisputesService.openDispute()
   ├─ insert dispute_cases
   └─ CommissionService.cancelReleaseJob(orderId)

DisputesService.resolveDispute()
   ├─ no_refund → CommissionService.scheduleReleaseJob(... delay=0)
   └─ refund    → RPC: clawback_merchant_pending_for_refund
```

---

## Running

```bash
cd packages/api
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REDIS_URL, INTERNAL_API_KEY
npm install
npm run start:dev
```

### Required infrastructure

| Service       | Purpose                                                      |
| ------------- | ------------------------------------------------------------ |
| Supabase / PG | Stores all marketplace tables (run both migrations first)    |
| Redis         | BullMQ backend for the `release-pending-balance` queue       |

### Required SQL migrations (in order)

1. `supabase/migrations/20260504000000_chopfast_multivendor_marketplace.sql`
2. `supabase/migrations/20260504000100_commission_engine_rpc.sql`
3. `supabase/migrations/20260504000200_merchant_registration_fields.sql`
4. `supabase/migrations/20260504000300_withdrawal_wallet_rpc.sql`

---

## Merchant registration (Phase 2 onboarding)

Public routes (no `x-internal-key`). Global prefix is `api/v1`, so:

- `POST /api/v1/merchant/register/request-otp` — **Resend** email OTP to **owner_email**; stores an HMAC hash in Redis (10 min TTL). Body: `{ "owner_email": "…" }`.
- `POST /api/v1/merchant/register` — Full **steps 1–4** JSON payload (step 5 is review-only in UI).
- `POST /api/v1/merchant/auth/login` — Email/password; returns a **ChopFast merchant JWT** (HS256,
  `MERCHANT_JWT_SECRET`) with claims `merchantId`, `userId`, `role: 'merchant'`, plus `verified`
  and `active` from the `merchants` row. Use `Authorization: Bearer <token>` on protected merchant
  routes (e.g. withdrawals). TTL: `MERCHANT_JWT_EXPIRES_SEC` (default 86400).

Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional `RESEND_FROM_NAME`, `INTERNAL_API_KEY` (pepper for OTP hash),
`PAYSTACK_SECRET_KEY`, `REDIS_URL`, `CLOUDINARY_CLOUD_NAME` (optional URL restriction),
`MERCHANT_REG_OTP_BYPASS` (development only, when `RESEND_API_KEY` is unset), `MERCHANT_JWT_SECRET`,
optional `MERCHANT_JWT_EXPIRES_SEC`. (`TERMII_*` is still used for withdrawal OTP SMS and application SMS.)

Documents must already be uploaded to **Cloudinary** from the client; the API stores HTTPS URLs in
`merchant_documents`. Paystack **Resolve** is executed server-side; `merchant_bank_accounts` is
created with `is_verified=true`. NIN/BVN is stored as a **bcrypt hash** only (`identity_number_hash`).

See `chopfast-multivendor-skill/references/02-merchant-onboarding.md` for field meanings.

### Post-approval / rejection / RFI notifications (internal)

After the super-admin updates `merchants` in Supabase, call this so the merchant gets **SendGrid
email** (if `SENDGRID_*` is set), **Termii SMS** on `owner_phone` (if `TERMII_API_KEY` is set), and
an in-app row in `merchant_notifications`:

- `POST /api/v1/internal/merchant-applications/notify` — header `x-internal-key`, JSON body:
  - `{ "merchant_id": "<uuid>", "event": "approved" }` — requires `is_verified` and `is_active` true.
  - `{ "merchant_id": "<uuid>", "event": "rejected", "message": "…" }` — min 8 chars.
  - `{ "merchant_id": "<uuid>", "event": "rfi", "message": "…" }` — min 8 chars.

Env: `CUSTOMER_WEB_BASE_URL`, optional `MERCHANT_PORTAL_BASE_URL`, `PLATFORM_NAME`,
`PLATFORM_SUPPORT_EMAIL`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`.

The **admin** app proxies this without exposing the internal key: server route
`POST /api/merchant-applications/notify` with `CHOPFAST_API_URL` + `CHOPFAST_INTERNAL_API_KEY`.

---

## Merchant operations — Phase 3 (`MerchantOperationsModule`)

All routes below require `Authorization: Bearer <merchant JWT>` and a **verified, active, non-suspended**
merchant (`MerchantJwtGuard` + `MerchantVerifiedGuard`).

### Menu (scoped `merchant_id`)

| Method | Path |
| ------ | ---- |
| `GET` | `/api/v1/merchant/menu/categories` |
| `POST` | `/api/v1/merchant/menu/categories` |
| `PUT` | `/api/v1/merchant/menu/categories/:id` |
| `DELETE` | `/api/v1/merchant/menu/categories/:id` |
| `GET` | `/api/v1/merchant/menu/items?category_id=<optional>` |
| `POST` | `/api/v1/merchant/menu/items` |
| `PUT` | `/api/v1/merchant/menu/items/:id` |
| `PATCH` | `/api/v1/merchant/menu/items/:id/availability` — body `{ "is_available": true }` |

### Orders (scoped `merchant_id`)

| Method | Path |
| ------ | ---- |
| `GET` | `/api/v1/merchant/orders?limit=50` |
| `GET` | `/api/v1/merchant/orders/:id` |
| `PATCH` | `/api/v1/merchant/orders/:id/status` — body `{ "status": "confirmed" \| "preparing" \| "ready" \| "out_for_delivery" \| "cancelled" }` |

### Realtime — Socket.IO

- Namespace: **`/merchant`** (same host/port as the HTTP API). Connect with Socket.IO client and
  pass the merchant JWT as `auth: { token: "<jwt>" }` or `Authorization: Bearer <jwt>` on the
  handshake.
- Room: `merchant:<merchantId>`. Server emits **`new_order`** with the order payload.
- To push from your order service (server-side):  
  `POST /api/v1/internal/merchant-realtime/emit-new-order` with `x-internal-key` and body  
  `{ "merchant_id": "<uuid>", "order": { ... } }`.

`main.ts` enables the Socket.IO adapter via `IoAdapter`.

---

## Phase 4 — Wallet & payouts (`WalletModule` + `WithdrawalModule`)

Merchant wallet and payout routes require **`Authorization: Bearer <merchant JWT>`** (see
`POST /api/v1/merchant/auth/login`) and a **verified, active** merchant (`MerchantVerifiedGuard`).

### Read APIs (`WalletModule`)

| Method | Path |
| ------ | ---- |
| `GET` | `/api/v1/merchant/wallet` — balances (`wallet_initialized: false` until the first commission credit creates a row) |
| `GET` | `/api/v1/merchant/wallet/transactions?limit=50&offset=0` — ledger page (max `limit` 100) |
| `GET` | `/api/v1/merchant/bank-accounts` — verified NUBAN rows for the payout picker |

### Withdrawals & Paystack Transfer (`WithdrawalModule`)

| Step | Method | Path |
| ---- | ------ | ---- |
| List | `GET` | `/api/v1/merchant/withdrawals?limit=50&offset=0` |
| Detail | `GET` | `/api/v1/merchant/withdrawals/:withdrawalId` |
| 1. Request (debit wallet) | `POST` | `/api/v1/merchant/withdrawals` — body `{ "bank_account_id", "amount" }` |
| 2. OTP (Termii) | `POST` | `/api/v1/merchant/withdrawals/:withdrawalId/send-otp` |
| 3. Initiate transfer | `POST` | `/api/v1/merchant/withdrawals/:withdrawalId/initiate` — body `{ "otp" }` |
| Webhooks | `POST` | `/api/v1/webhooks/paystack` — Paystack `transfer.success` / `transfer.failed` / `transfer.reversed` |

- **OTP gate:** Termii verify; **max 3 failed attempts** per withdrawal within the OTP window — then
  the merchant must call **send-otp** again (which resets the counter).
- Amounts **≥** `WITHDRAWAL_ADMIN_THRESHOLD_NGN` (default 500,000) set `admin_approved=false` until a super admin approves (e.g. `UPDATE merchant_withdrawals SET admin_approved = true WHERE id = …`).
- **Failure:** Paystack API errors during `initiate` and webhook `transfer.failed` / `transfer.reversed` call
  `merchant_wallet_restore_failed_withdrawal` — available balance is restored and a `manual_credit` ledger row is written.
- **Webhooks:** `main.ts` enables `rawBody: true` for HMAC verification with `x-paystack-signature`.

Reference: `chopfast-multivendor-skill/references/04-wallet-payouts.md`

---

## Triggering the engine

### From an HTTP order-service webhook

```http
POST /api/v1/internal/commission/orders/delivered
Content-Type: application/json
x-internal-key: <INTERNAL_API_KEY>

{ "orderId": "00000000-0000-0000-0000-000000000abc" }
```

### From inside the same NestJS process

```ts
import { EventEmitter2 } from '@nestjs/event-emitter';

eventEmitter.emit('order.delivered', { orderId });
```

### Disputes

```http
POST /api/v1/internal/disputes/open
{
  "orderId": "...",
  "customerId": "...",
  "reason": "missing_item",
  "description": "Forgot the suya"
}

POST /api/v1/internal/disputes/resolve
{
  "disputeId": "...",
  "outcome": "resolved_refund",
  "refundAmount": 1500,
  "resolvedBy": "<admin_user_id>"
}
```

---

## What's intentionally NOT in here yet

This package started as Phase 1 (commission). Additionally implemented:

- **Merchant registration** HTTP API (`MerchantRegistrationModule`) — onboarding payload,
  Termii OTP, Paystack resolve, Cloudinary URL validation.

Still out of scope or partial:

- Merchant portal frontend (Phase 5 — `references/03-merchant-portal.md`)
- Customer-facing changes (Phase 6)
- Super admin queue, financials dashboard (Phase 7)

Per the skill's **GUIDING PRINCIPLES**: this is additive — none of the
existing customer/order flows in `apps/web`, `apps/mobile`, or `apps/admin`
need to change as a result of this package landing.
