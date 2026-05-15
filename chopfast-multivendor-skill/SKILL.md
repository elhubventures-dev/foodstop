---
name: chopfast-multivendor-marketplace
description: >
  Full-stack skill for transforming an existing single-restaurant platform into a
  complete multi-vendor food marketplace (Nigerian context). Use this skill whenever
  the user wants to: add multi-restaurant / multi-vendor support to a food app,
  build a merchant registration and onboarding system, implement per-merchant wallet
  and commission splitting, build a merchant portal/dashboard, add restaurant
  discovery and storefront pages for customers, implement withdrawal and payout flows
  via Paystack Transfer API, add merchant analytics, merchant KYC/verification, or
  any combination of these. Also trigger for phrases like "other restaurants can
  join", "vendor marketplace", "commission from orders", "merchant wallet",
  "restaurant can register", "multi-restaurant platform", or "food delivery
  marketplace". This skill covers the full stack: database schema, backend API,
  merchant portal frontend, customer-facing changes, and super admin additions.
---

# ChopFast Multi-Vendor Marketplace Skill

Transforms an existing single-restaurant food ordering platform into a full
multi-vendor food marketplace. Other restaurants register, list menus, receive
orders, earn revenue into a wallet, and withdraw funds. The platform charges
**15% commission** on every order's food subtotal. All 15 approved feature
extensions are included.

> **Read order:** Start here. For deep implementation detail, read the relevant
> reference file before writing any code for that domain:
> - Database + Commission Engine → `references/01-database-commission.md`
> - Merchant Auth + Onboarding → `references/02-merchant-onboarding.md`
> - Merchant Portal Dashboard → `references/03-merchant-portal.md`
> - Wallet + Withdrawals → `references/04-wallet-payouts.md`
> - Customer-Facing Changes → `references/05-customer-changes.md`
> - Super Admin Additions → `references/06-super-admin.md`
> - All API Endpoints → `references/07-api-endpoints.md`
> - UI/UX Design Spec → `references/08-ui-design.md`
> - Trust, Safety & Fraud → `references/09-trust-safety.md`
> - Marketing & Growth Features → `references/10-marketing-growth.md`

---

## GUIDING PRINCIPLES

1. **Additive, not destructive** — every change layers onto the existing codebase.
   The original ChopFast restaurant becomes merchant_id = 1 (the verified anchor
   merchant). No existing customer flows break.

2. **Tenant isolation at every layer** — every DB query, API route, and UI view
   must be scoped to `merchant_id`. A merchant NEVER sees another merchant's
   orders, earnings, or customers.

3. **Commission is sacred** — the 15% split happens server-side only, triggered
   by the order `DELIVERED` webhook/event. It is never exposed to merchants as
   something they can modify. Rate is configurable per merchant by Super Admin only.

4. **Money never disappears** — every naira is accounted for. Failed payouts
   auto-restore to wallet. Refunds claw back from merchant net. Every movement
   hits `merchant_wallet_transactions` before any balance changes.

5. **Nigerian-first** — Paystack for payments and payouts, Termii for SMS OTP,
   NUBAN account validation, NGN currency throughout, Nigerian states/cities,
   NDPR-compliant data handling.

---

## BUILD ORDER

Follow this sequence strictly. Each phase has a gate — don't proceed until the
gate condition is met.

```
Phase 1 — Foundation          (Gate: migrations run, seed data in place)
  ├── DB schema additions
  ├── Existing table alterations
  └── Commission engine service

Phase 2 — Merchant Identity   (Gate: merchant can register, login, get JWT)
  ├── Merchant auth system
  ├── KYC document upload
  └── Admin approval workflow

Phase 3 — Merchant Operations (Gate: merchant can receive and action orders)
  ├── Scoped menu CRUD API
  ├── Scoped order management API
  └── WebSocket merchant namespace

Phase 4 — Wallet & Payouts    (Gate: commission splits correctly, withdrawal succeeds)
  ├── Wallet service
  ├── Paystack Transfer integration
  └── Withdrawal request flow

Phase 5 — Merchant Portal UI  (Gate: all portal screens render with live data)
  ├── Auth pages
  ├── Dashboard + live orders
  ├── Menu management
  ├── Wallet + withdrawals
  └── Analytics + settings

Phase 6 — Customer Changes    (Gate: customer can discover and order from any merchant)
  ├── Restaurant discovery page
  ├── Merchant storefront page
  ├── Cross-merchant cart enforcement
  └── Search spanning all merchants

Phase 7 — Super Admin         (Gate: admin can manage merchants and platform finances)
  ├── Merchant application queue
  ├── Platform financials dashboard
  └── Payout management center

Phase 8 — Growth & Safety     (Gate: all 15 approved features active)
  ├── Merchant tiers + badges
  ├── Featured placement system
  ├── Dispute + escrow extension
  ├── Anti-fraud flagging
  ├── Merchant email marketing tool
  ├── Platform flash sales
  ├── VAT remittance module
  ├── Invoice generator
  └── Rating threshold enforcement
```

---

## PHASE 1 — FOUNDATION

### 1.1 Core Schema (read `references/01-database-commission.md` for full DDL)

Key tables to create:
```
merchants, merchant_documents, merchant_wallets,
merchant_wallet_transactions, merchant_withdrawals,
merchant_bank_accounts, merchant_notifications,
platform_commission_ledger, merchant_reviews,
merchant_promotions, merchant_tiers, merchant_tier_history,
merchant_featured_slots, platform_flash_sales,
merchant_team_members, merchant_invoices,
dispute_cases, fraud_flags
```

Key alterations to existing tables:
```sql
ALTER TABLE menu_categories ADD COLUMN merchant_id UUID REFERENCES merchants(id);
ALTER TABLE menu_items      ADD COLUMN merchant_id UUID REFERENCES merchants(id);
ALTER TABLE orders          ADD COLUMN merchant_id UUID REFERENCES merchants(id);
ALTER TABLE order_items     ADD COLUMN merchant_id UUID REFERENCES merchants(id);
```

Add indexes on every `merchant_id` foreign key column.

### 1.2 Commission Engine Service

File: `packages/api/src/services/commission.service.ts`

```typescript
// Triggered ONLY when order status changes to DELIVERED
async function processOrderCommission(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  const merchant = await getMerchantById(order.merchantId);

  const commissionRate = merchant.commissionRate ?? 0.15;  // default 15%
  const foodSubtotal   = order.subtotal;                   // food only, excl. delivery + VAT
  const commissionAmt  = round2(foodSubtotal * commissionRate);
  const merchantNet    = round2(foodSubtotal - commissionAmt);
  const vatAmount      = round2(foodSubtotal * 0.075);     // 7.5% VAT held by platform

  await db.transaction(async (trx) => {
    // 1. Log to commission ledger
    await trx('platform_commission_ledger').insert({
      order_id: orderId, merchant_id: order.merchantId,
      order_total: order.grandTotal, food_subtotal: foodSubtotal,
      commission_rate: commissionRate, commission_amount: commissionAmt,
      vat_amount: vatAmount, merchant_net: merchantNet,
    });

    // 2. Credit merchant pending balance (2-hour hold)
    await trx('merchant_wallets')
      .where({ merchant_id: order.merchantId })
      .increment({ pending_balance: merchantNet, total_earned: merchantNet });

    // 3. Log wallet transaction
    await trx('merchant_wallet_transactions').insert({
      merchant_id: order.merchantId, type: 'credit',
      amount: foodSubtotal, commission_amount: commissionAmt,
      net_amount: merchantNet, order_id: orderId,
      status: 'pending', description: `Order #${order.reference} delivered`,
    });

    // 4. Schedule release from pending → available after 2 hours
    await scheduleJob('release-pending-balance', {
      merchantId: order.merchantId, orderId, amount: merchantNet,
      runAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
  });

  // 5. Notify merchant
  await notifyMerchant(order.merchantId, 'wallet_credit', {
    amount: merchantNet, orderId,
  });
}
```

> **Dispute extension:** if a dispute is opened within the 2-hour window,
> the scheduled release job is cancelled and funds stay in `pending_balance`
> until Super Admin resolves. See `references/09-trust-safety.md`.

---

## PHASE 2 — MERCHANT IDENTITY

See `references/02-merchant-onboarding.md` for:
- Full 5-step registration form spec
- KYC document types + Cloudinary upload config
- Admin review workflow (approve / reject / request more info)
- Merchant JWT scope (`role: 'merchant'`) separate from customer JWT
- OTP verification flow via Termii SMS
- Post-approval email + SMS templates
- "Become a Vendor" public landing page copy + layout

**Auth middleware pattern:**
```typescript
// Separate middleware — merchant routes use this, not the customer auth middleware
export const merchantAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyJWT(token, process.env.MERCHANT_JWT_SECRET);
  if (decoded.role !== 'merchant') return res.status(403).json({ error: 'Forbidden' });
  req.merchant = await getMerchantById(decoded.merchantId);
  if (!req.merchant.isVerified) return res.status(403).json({ error: 'Pending verification' });
  next();
};
```

---

## PHASE 3 — MERCHANT OPERATIONS

All merchant API routes are prefixed `/merchant/` and protected by `merchantAuth`.
All DB queries append `WHERE merchant_id = req.merchant.id` — never trust a
merchant_id from the request body.

See `references/07-api-endpoints.md` for all route definitions.

**WebSocket merchant namespace:**
```typescript
// Socket.io namespace — merchant portal subscribes on login
const merchantNS = io.of('/merchant');
merchantNS.use(merchantSocketAuth);
merchantNS.on('connection', (socket) => {
  const roomId = `merchant:${socket.merchant.id}`;
  socket.join(roomId);
});

// Emit new order to merchant's room
export function emitNewOrder(merchantId: string, order: Order) {
  io.of('/merchant').to(`merchant:${merchantId}`).emit('new_order', order);
}
```

---

## PHASE 4 — WALLET & PAYOUTS

See `references/04-wallet-payouts.md` for full implementation. Key points:

**Withdrawal flow:**
```
1. Merchant requests withdrawal (amount, bank_account_id)
2. Validate: amount ≤ available_balance, bank verified
3. Deduct from available_balance IMMEDIATELY (optimistic lock)
4. Log wallet transaction (type: 'withdrawal', status: 'pending')
5. Create Paystack recipient (if not cached)
6. Initiate Paystack Transfer
7. Store transfer_code on withdrawal record
8. Webhook: transfer.success → mark completed, notify merchant
9. Webhook: transfer.failed  → restore balance, mark failed, notify merchant
```

**OTP gate before withdrawal:**
- Send OTP to merchant phone via Termii
- Merchant enters OTP in UI
- Validate before initiating Paystack transfer
- OTP expires in 10 minutes, max 3 attempts

---

## PHASE 5 — MERCHANT PORTAL UI

Route: `/merchant` (separate Next.js route group or subdomain)
See `references/03-merchant-portal.md` for all screen specs.
See `references/08-ui-design.md` for full design tokens and component list.

**Portal navigation structure:**
```
Sidebar (desktop) / Bottom tabs (mobile):
  Overview        /merchant/dashboard
  Live Orders     /merchant/orders/live
  Order History   /merchant/orders/history
  Menu            /merchant/menu
  Wallet          /merchant/wallet
  Withdrawals     /merchant/withdrawals
  Analytics       /merchant/analytics
  Reviews         /merchant/reviews
  Promotions      /merchant/promotions
  Settings        /merchant/settings
  Help            /merchant/help
```

---

## PHASE 6 — CUSTOMER-FACING CHANGES

See `references/05-customer-changes.md` for full specs. Summary:

- New `/restaurants` discovery page with merchant cards + filters
- New `/restaurants/[merchantId]` storefront page (menu scoped to merchant)
- Cart: enforce single-merchant rule with prompt on violation
- Global search: spans all merchants' menus + restaurant names
- Homepage: new "Explore Restaurants" section
- Order tracking: shows merchant branding
- Post-delivery: two separate ratings (food/restaurant + rider)

---

## PHASE 7 — SUPER ADMIN ADDITIONS

See `references/06-super-admin.md` for full specs. Summary:

- Merchant application queue with SLA tracker (flag >48h unreviewed)
- Individual merchant drill-down: full profile, orders, wallet, docs
- Platform financials: GMV, commission collected, net revenue, payout volume
- Payout management center: approve/reject/bulk-process withdrawal requests
- Commission rate override per merchant
- Merchant suspension / reinstatement workflow
- Featured merchant slot management
- Platform-wide broadcast tool (email + SMS + in-portal)

---

## PHASE 8 — GROWTH & SAFETY FEATURES

See `references/09-trust-safety.md` for:
- Dispute & escrow extension (24h hold on dispute)
- Anti-fraud flagging rules (COD threshold, velocity checks, address anomalies)
- Rating threshold auto-suspension (< 3.0 stars → warning, < 2.5 for 30 days → suspend)
- Merchant referral program mechanics
- VAT remittance module + FIRS quarterly report generator
- Monthly merchant invoice PDF generator

See `references/10-marketing-growth.md` for:
- Merchant tier system (Bronze → Silver → Gold → Platinum) + commission benefits
- Paid featured placement (merchant pays platform for homepage slot)
- Platform-wide flash sales (super admin orchestrates, platform absorbs discount)
- Merchant email marketing tool (opt-in customer list, NDPR compliant, SendGrid)
- Merchant mobile companion app spec (V1 — lightweight React Native)

---

## FEATURE COMPLETION CHECKLIST

Before marking this skill complete, every item below must be ticked:

### Database
- [ ] All new tables created with indexes
- [ ] Existing tables altered (merchant_id columns)
- [ ] Seed: existing restaurant converted to merchant_id = 1

### Commission Engine
- [ ] Fires on DELIVERED status only
- [ ] Calculates on food subtotal (not delivery fee, not VAT)
- [ ] Logs to platform_commission_ledger
- [ ] Credits merchant pending_balance
- [ ] Schedules 2-hour release job
- [ ] Dispute hook cancels release job
- [ ] VAT (7.5%) logged separately

### Merchant Auth & Onboarding
- [ ] 5-step registration form
- [ ] KYC document upload
- [ ] Termii OTP verification
- [ ] Admin approval workflow
- [ ] Merchant JWT (separate secret from customer JWT)
- [ ] merchantAuth middleware
- [ ] "Become a Vendor" public landing page

### Merchant Portal
- [ ] All 15 portal screens built
- [ ] Real-time orders via WebSocket
- [ ] Menu CRUD + CSV import
- [ ] Wallet page + transaction ledger
- [ ] Withdrawal flow + OTP gate
- [ ] Bank account management (Paystack resolve)
- [ ] Analytics (sales, items, customers, commission)
- [ ] Reviews + reply
- [ ] Merchant promotions
- [ ] Team sub-accounts (3 roles)
- [ ] Store settings (all tabs)
- [ ] Notification center
- [ ] Help / support tickets

### Wallet & Payouts
- [ ] Paystack Transfer recipient creation
- [ ] Withdrawal initiation
- [ ] transfer.success webhook handler
- [ ] transfer.failed webhook (auto-restore balance)
- [ ] Batch payout (super admin trigger)
- [ ] Withdrawal OTP gate

### Customer Changes
- [ ] Restaurant discovery page + filters
- [ ] Merchant storefront page
- [ ] Single-merchant cart enforcement
- [ ] Cross-merchant search
- [ ] Merchant-branded order tracking
- [ ] Per-merchant reviews + ratings

### Super Admin
- [ ] Merchant application queue
- [ ] Individual merchant admin view
- [ ] Platform financials dashboard
- [ ] Payout management center
- [ ] Commission rate override
- [ ] Featured merchant management
- [ ] Broadcast communication tool

### Growth & Safety (All 15 approved features)
- [ ] VAT remittance module
- [ ] Monthly merchant invoice PDF
- [ ] Escrow 24h dispute extension
- [ ] Merchant tier system (4 tiers)
- [ ] Merchant referral program
- [ ] Paid featured placement
- [ ] Rating threshold auto-suspension
- [ ] Customer dispute + refund workflow
- [ ] Anti-fraud / suspicious order flagging
- [ ] Platform-wide flash sales
- [ ] Merchant email marketing tool (NDPR)
- [ ] Merchant mobile companion app (V1)
- [ ] Multi-location per merchant account
- [ ] Inventory / stock management per item
- [ ] Merchant chat with platform support
