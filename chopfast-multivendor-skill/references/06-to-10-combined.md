# Reference 06 — Super Admin Additions

## Merchant Application Queue

Table columns: Business Name | City | Category | Documents | Submitted | SLA | Status | Actions
- SLA badge: 🟢 < 24h | 🟡 24-48h | 🔴 > 48h
- Quick filter buttons: All | Pending | Approved | Rejected | More Info Requested
- Search by name / email / city
- Click row → full review screen

## Individual Merchant Admin View

Tabs: Overview | Orders | Wallet | Documents | Settings | Actions

Overview tab: all KPI metrics + charts (same data as merchant portal, but uneditable read-only)
Orders tab: full order history with export
Wallet tab: full wallet balance + ledger + commission breakdown + all withdrawals
Documents tab: inline document viewer + approve/reject each doc individually
Settings tab: read-only view of all merchant settings

Actions panel (right sidebar, always visible on this screen):
```
Commission Rate: [15% ▼ Override]  → opens input modal
[✅ Approve Merchant]
[⚠️ Suspend Merchant]   → requires reason
[🔄 Unsuspend]
[💸 Manual Wallet Adjustment] → credit or debit + reason (audit logged)
[📧 Email Merchant]
[🗑️ Close Account]       → irreversible, requires double confirm
```

## Platform Financials Dashboard

KPI Cards:
- Total GMV (all orders all merchants, period selector)
- Platform Commission Collected
- Total Merchant Payouts
- Platform Net Revenue (commission - Paystack transfer fees)
- Pending Withdrawal Requests (count + total value)
- Active Merchants

Charts:
- GMV vs Commission waterfall chart
- Revenue by merchant (horizontal bar leaderboard, top 20)
- Daily revenue trend
- Commission rate distribution pie

Export: Full financial report (CSV + PDF) for any date range

VAT Reports section:
- Quarterly FIRS export (structured per FIRS format)
- Per-merchant VAT summary
- Download as CSV / PDF

## Payout Management Center

Table: Merchant | Amount | Bank | Requested | Status | Actions
Filter: pending | processing | completed | failed
Bulk actions: [Approve Selected] [Process All Pending]
Individual actions: Approve → triggers processWithdrawal() | Reject (restores balance) | View Details

Withdrawal approval threshold setting:
- Auto-approve if < ₦X (configurable, default ₦500,000)
- Manual admin approval required for ₦500,000+

## Featured Merchant Slot Management

Interface to manage paid homepage placements:
- Active slots table: merchant, slot type, dates, amount paid, status
- [Create Featured Slot]: select merchant, slot type, date range, amount paid
- Slot types: Homepage Hero | Category Top | Search Top
- Preview how merchant will appear in that slot
- Bulk slot import from CSV (for agency bookings)

## Platform Configuration Panel

Settings:
- Global commission rate (default 15%)
- Pending hold duration (default 2 hours)
- Withdrawal auto-approval threshold (default ₦500k)
- Minimum withdrawal amount (default ₦1,000)
- Anti-fraud: COD threshold, velocity window
- Rating threshold for warning (default 3.0)
- Rating threshold for auto-suspension (default 2.5)
- Days at low rating before suspension (default 30)
- Flash sale budget cap default
- Platform name, logo, support email, support phone
- Feature flags (toggle features on/off platform-wide)

---

# Reference 07 — API Endpoints

## Merchant Auth
```
POST   /api/merchant/register              Register new merchant (5-step payload)
POST   /api/merchant/login                 Merchant login → tokens
POST   /api/merchant/logout
POST   /api/merchant/refresh-token
POST   /api/merchant/verify-otp            OTP verification on register
POST   /api/merchant/forgot-password
POST   /api/merchant/reset-password
GET    /api/merchant/application-status    Check approval status
POST   /api/merchant/documents/upload      KYC document upload (signed Cloudinary URL)
```

## Merchant Store
```
GET    /api/merchant/profile
PUT    /api/merchant/profile
PATCH  /api/merchant/store/toggle          Open/close store instantly
GET    /api/merchant/store/hours
PUT    /api/merchant/store/hours
POST   /api/merchant/store/special-hours
POST   /api/merchant/store/temporary-close
```

## Merchant Menu (all scoped to req.merchant.id)
```
GET    /api/merchant/menu/categories
POST   /api/merchant/menu/categories
PUT    /api/merchant/menu/categories/:id
DELETE /api/merchant/menu/categories/:id
PATCH  /api/merchant/menu/categories/:id/reorder
GET    /api/merchant/menu/items
POST   /api/merchant/menu/items
PUT    /api/merchant/menu/items/:id
DELETE /api/merchant/menu/items/:id
PATCH  /api/merchant/menu/items/:id/availability
PATCH  /api/merchant/menu/items/:id/stock
POST   /api/merchant/menu/import           CSV bulk upload
GET    /api/merchant/menu/import/template  Download CSV template
```

## Merchant Orders
```
GET    /api/merchant/orders                List (filter: status, date, search)
GET    /api/merchant/orders/live           SSE/WebSocket stream of live orders
GET    /api/merchant/orders/:id
PATCH  /api/merchant/orders/:id/accept     + set prep_time_minutes
PATCH  /api/merchant/orders/:id/reject     + reason
PATCH  /api/merchant/orders/:id/ready
GET    /api/merchant/orders/export         CSV/PDF export
```

## Merchant Wallet
```
GET    /api/merchant/wallet
GET    /api/merchant/wallet/transactions   Paginated ledger
GET    /api/merchant/wallet/commission-log Per-order commission breakdown
```

## Merchant Withdrawals
```
POST   /api/merchant/withdrawals/send-otp
POST   /api/merchant/withdrawals/verify-otp
POST   /api/merchant/withdrawals/request
GET    /api/merchant/withdrawals
GET    /api/merchant/withdrawals/:id
```

## Merchant Bank Accounts
```
GET    /api/merchant/bank-accounts
POST   /api/merchant/bank-accounts        Includes Paystack resolve call
DELETE /api/merchant/bank-accounts/:id
PATCH  /api/merchant/bank-accounts/:id/default
GET    /api/merchant/bank-accounts/resolve?account_number=&bank_code=
```

## Merchant Analytics
```
GET    /api/merchant/analytics/sales?period=&from=&to=
GET    /api/merchant/analytics/items?sort=orders|revenue&limit=10
GET    /api/merchant/analytics/customers
GET    /api/merchant/analytics/commission
GET    /api/merchant/analytics/heatmap     Peak hours data
```

## Merchant Promotions
```
GET    /api/merchant/promotions
POST   /api/merchant/promotions
DELETE /api/merchant/promotions/:id
PATCH  /api/merchant/promotions/:id/toggle
```

## Merchant Reviews
```
GET    /api/merchant/reviews?rating=&page=
POST   /api/merchant/reviews/:id/reply
POST   /api/merchant/reviews/:id/flag
```

## Merchant Team
```
GET    /api/merchant/team
POST   /api/merchant/team/invite
PATCH  /api/merchant/team/:memberId/role
DELETE /api/merchant/team/:memberId
GET    /api/merchant/team/activity-log
```

## Merchant Notifications
```
GET    /api/merchant/notifications?page=&unread=true
PATCH  /api/merchant/notifications/read-all
DELETE /api/merchant/notifications/:id
```

## Customer — Multi-Vendor
```
GET    /api/restaurants?lat=&lng=&radius=&cuisine=&open=&sort=
GET    /api/restaurants/:slug              Merchant storefront
GET    /api/restaurants/:slug/menu         Menu scoped to merchant
GET    /api/restaurants/:slug/reviews
GET    /api/search?q=&type=food|restaurant&lat=&lng=&radius=
```

## Admin — Merchant Management
```
GET    /api/admin/merchants?status=&city=&search=
GET    /api/admin/merchants/:id
PATCH  /api/admin/merchants/:id/approve
PATCH  /api/admin/merchants/:id/reject
PATCH  /api/admin/merchants/:id/suspend
PATCH  /api/admin/merchants/:id/unsuspend
PUT    /api/admin/merchants/:id/commission-rate
POST   /api/admin/merchants/:id/wallet/adjust
GET    /api/admin/merchants/:id/orders
GET    /api/admin/merchants/:id/wallet
GET    /api/admin/merchants/:id/documents
GET    /api/admin/withdrawals?status=&merchant=
PATCH  /api/admin/withdrawals/:id/approve
PATCH  /api/admin/withdrawals/:id/reject
POST   /api/admin/withdrawals/batch-process
GET    /api/admin/platform/financials
GET    /api/admin/platform/commission-ledger
GET    /api/admin/platform/vat-report?quarter=&year=
POST   /api/admin/featured-slots
GET    /api/admin/featured-slots
DELETE /api/admin/featured-slots/:id
POST   /api/admin/flash-sales
GET    /api/admin/flash-sales
POST   /api/admin/broadcast
```

## WebSocket Events — New
```
Namespace: /merchant

Server → Client:
  new_order           { order }              New order arrived
  order_cancelled     { orderId, reason }    Order cancelled by customer
  order_status_update { orderId, status }    Status changed
  wallet_credit       { amount, orderId }    Funds credited
  payout_success      { amount, bankName }   Withdrawal completed
  payout_failed       { amount, reason }     Withdrawal failed
  rating_received     { rating, review }     New review
  store_suspended     { reason }             Admin suspended store
  platform_announcement { title, body }      Broadcast from admin

Client → Server:
  join_merchant_room  { merchantId }
  order_accepted      { orderId, prepMinutes }
  order_rejected      { orderId, reason }
  order_ready         { orderId }
  heartbeat           {}                     Keep connection alive
```

---

# Reference 08 — UI/UX Design Specification

## Merchant Portal Design Tokens

```css
:root {
  /* Brand (consistent with customer app) */
  --color-primary:      #C8410B;  /* Terracotta */
  --color-primary-light:#F4A87C;
  --color-secondary:    #F5A623;  /* Saffron */
  --color-accent:       #2D6A4F;  /* Forest green */

  /* Merchant Portal (SaaS, more neutral) */
  --color-sidebar-bg:   #16191F;
  --color-sidebar-text: #A0AEC0;
  --color-sidebar-active: #FFFFFF;
  --color-sidebar-active-bg: rgba(200,65,11,0.15);

  --color-main-bg:      #F7F8FA;
  --color-card-bg:      #FFFFFF;
  --color-border:       #E8ECF0;

  --color-success:      #22C55E;
  --color-warning:      #F59E0B;
  --color-error:        #EF4444;
  --color-info:         #3B82F6;

  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted:   #9CA3AF;

  /* Financials — use monospace for all currency */
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-xs: 4px;   --space-sm: 8px;   --space-md: 16px;
  --space-lg: 24px;  --space-xl: 32px;  --space-2xl: 48px;

  /* Radius */
  --radius-sm: 6px;  --radius-md: 10px;
  --radius-lg: 16px; --radius-full: 9999px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.15);
}
```

## Typography
```
Headings:    Cabinet Grotesk, Bold/ExtraBold
Body:        Satoshi, Regular/Medium/SemiBold
Currency:    JetBrains Mono (all ₦ figures)
```

## Status Colors (consistent across all UI)
```
New Order:    #3B82F6 (blue) — action required
Confirmed:    #8B5CF6 (purple) — in queue
Preparing:    #F59E0B (amber) — in kitchen
Ready:        #22C55E (green) — ready for rider
Dispatched:   #06B6D4 (cyan) — on the way
Delivered:    #6B7280 (gray) — complete
Cancelled:    #EF4444 (red)
Rejected:     #DC2626 (dark red)
```

## Merchant Tier Badge Colors
```
Bronze:   #CD7F32  background: #FFF4E6
Silver:   #9CA3AF  background: #F3F4F6
Gold:     #F59E0B  background: #FFFBEB
Platinum: #7C3AED  background: #F5F3FF
```

## Key Component Patterns

### KPI Card
```
┌─────────────────────────┐
│ 📊 Icon    Card Title   │
│                         │
│ ₦142,500               │  ← JetBrains Mono, 28px, bold
│ +12.4% vs last week ↑  │  ← success color if positive
└─────────────────────────┘
```

### Data Table
- Sticky header
- Alternating row shading (white / #FAFAFA)
- Hover: row highlight #F0F4FF
- Sortable columns (click header → toggle asc/desc)
- Pagination: 25 rows default, 50/100 options
- Empty state: illustration + "No [items] yet" message
- Loading: skeleton rows (not spinner)

### Toast Notifications
- Top-right corner, stacked
- Auto-dismiss after 4 seconds
- Types: success (green), error (red), warning (amber), info (blue)
- Include action button if applicable: "View Order" | "Retry"

### Confirmation Modals
- Never use browser confirm()
- Custom modal with clear title, description, consequences
- Destructive action buttons: red + require typing "CONFIRM" for irreversible actions

---

# Reference 09 — Trust, Safety & Fraud

## Dispute & Escrow System

### Customer Dispute Flow
```
1. After delivery: customer can report issue (within 2 hours of delivery)
2. "Report a problem" → reason selection + description + photo upload
3. System creates dispute_case record
4. Cancels pending balance release job for this order
5. Funds locked in merchant pending_balance (not released, not withdrawn)
6. Super admin reviews: customer evidence + merchant response
7. Merchant notified → can submit evidence/response (48h window)
8. Admin decision:
   a. Refund approved → refundDeduction() called, customer refunded
   b. No refund → pending balance released to merchant
9. Both parties notified of decision
```

### Merchant Response Portal
- In merchant portal: "Dispute" section shows open cases
- Per dispute: customer claim, order details, [Add Evidence] button
- Evidence: text response + up to 5 photo uploads
- Submit before deadline countdown timer

## Anti-Fraud Flagging Rules

Implemented as a background job that runs after every order creation:

```typescript
const FRAUD_RULES = [
  {
    name: 'high_value_cod',
    check: (order) => order.payment_method === 'cash' && order.grand_total > 50000,
    severity: 'high',
    description: 'High-value cash on delivery order (> ₦50,000)',
  },
  {
    name: 'velocity_abuse',
    check: async (order) => {
      const recentOrders = await countOrdersByCustomer(order.customer_id, '1 hour');
      return recentOrders > 5;
    },
    severity: 'medium',
    description: 'Customer placed 5+ orders within 1 hour',
  },
  {
    name: 'repeated_refunds',
    check: async (order) => {
      const refundCount = await countRefundsByCustomer(order.customer_id, '30 days');
      return refundCount > 3;
    },
    severity: 'medium',
    description: 'Customer has 3+ refunds in past 30 days',
  },
  {
    name: 'address_anomaly',
    check: (order) => !order.delivery_address_verified, // failed geocode
    severity: 'low',
    description: 'Delivery address could not be verified',
  },
  {
    name: 'new_account_high_value',
    check: async (order) => {
      const age = await getAccountAgeDays(order.customer_id);
      return age < 3 && order.grand_total > 30000;
    },
    severity: 'high',
    description: 'New account (< 3 days) placing high-value order',
  },
];

// Flagged orders: require manual review before processing
// Super admin sees flags in dedicated "Fraud Review" queue
// Can: approve (process order) | reject (cancel order, refund) | escalate
```

## Rating Threshold Auto-Enforcement

Cron job runs daily at 03:00 WAT:

```typescript
async function checkMerchantRatings() {
  const merchantsToWarn = await db('merchants')
    .where('avg_rating', '<', 3.0)
    .where('avg_rating', '>=', 2.5)
    .where('is_active', true)
    .where('review_count', '>=', 10); // only act if sufficient review sample

  for (const merchant of merchantsToWarn) {
    await sendMerchantWarning(merchant.id, {
      rating: merchant.avg_rating,
      message: 'Your rating has dropped below 3.0. Improve service quality to avoid suspension.',
    });
  }

  // Check merchants below 2.5 for 30+ consecutive days
  const merchantsToSuspend = await db.raw(`
    SELECT m.id, mt.days_below_threshold
    FROM merchants m
    JOIN merchant_rating_history mt ON mt.merchant_id = m.id
    WHERE m.avg_rating < 2.5
      AND m.is_active = true
      AND mt.days_below_threshold >= 30
      AND m.review_count >= 10
  `);

  for (const merchant of merchantsToSuspend.rows) {
    await suspendMerchant(merchant.id, 'Sustained low rating (< 2.5 stars for 30+ days)');
    await notifyAdmins('merchant_auto_suspended', { merchantId: merchant.id });
  }
}
```

## VAT Remittance Module

```typescript
// Quarterly FIRS report generation
async function generateVATReport(quarter: number, year: number) {
  const { startDate, endDate } = getQuarterDates(quarter, year);

  const rows = await db('platform_commission_ledger as pcl')
    .join('merchants as m', 'pcl.merchant_id', 'm.id')
    .whereBetween('pcl.created_at', [startDate, endDate])
    .select(
      'm.business_name',
      'm.business_address',
      db.raw('SUM(pcl.food_subtotal) as taxable_supply'),
      db.raw('SUM(pcl.vat_amount) as vat_collected'),
      db.raw('COUNT(*) as transaction_count')
    )
    .groupBy('m.id', 'm.business_name', 'm.business_address');

  const totalVAT = rows.reduce((sum, r) => sum + parseFloat(r.vat_collected), 0);

  // Generate PDF report
  const pdfBuffer = await generateVATPDF({ rows, totalVAT, quarter, year });
  const pdfUrl = await uploadToCloudinary(pdfBuffer, `vat-report-Q${quarter}-${year}.pdf`);

  return { rows, totalVAT, pdfUrl };
}
```

---

# Reference 10 — Marketing & Growth Features

## Merchant Tier System

Evaluated monthly (cron: 1st of month, after invoice generation):

```
Tier     Monthly GMV          Commission    Perks
────────────────────────────────────────────────────────────
Bronze   ₦0 - ₦499,999       15%           Standard support
Silver   ₦500k - ₦1,999,999  13%           Priority support, Silver badge
Gold     ₦2M - ₦9,999,999    11%           Dedicated manager, Gold badge, featured rotation
Platinum ₦10M+               9%            Custom terms, premium placement, co-marketing
```

Commission override applied automatically when tier changes.
Merchants see tier badge in portal sidebar + storefront card.
Tier change → email + SMS + in-portal celebration animation.

## Merchant Referral Program

- Each approved merchant gets a unique referral link: `chopfast.ng/join?ref=MAMA-TITI-0042`
- When a new restaurant joins via referral link and gets approved:
  - Referrer receives: ₦5,000 wallet credit OR 1 month at reduced commission (-2%)
  - Referred merchant receives: First month at 12% commission (instead of 15%)
- Tracking: merchant_referrals table
- Referral dashboard in merchant portal: link + share button + referred restaurants list + earnings

## Paid Featured Placement

Merchant pays platform for premium visibility:
- Slots: Homepage Hero (₦50,000/week) | Category Top (₦20,000/week) | Search Top (₦15,000/week)
- Payment: deducted from merchant wallet OR via Paystack inline
- Duration: minimum 1 week, maximum 8 weeks
- Booked via: Merchant Portal → Growth → Featured Placement → [Book a Slot]
- Super admin approves all slot bookings (prevent conflicts)
- Analytics: impressions, clicks, orders attributed to featured slot

## Platform Flash Sales

Super Admin creates flash sale events:
- Title: "Free Delivery Friday!"
- Discount type: free delivery / % off / fixed ₦ off
- Applies to: all merchants or selected merchants
- Budget cap: platform absorbs up to ₦X before auto-ending sale
- Countdown timer shown to customers on homepage hero + banner
- Merchants notified 48h before: "You're part of ChopFast's Flash Friday Sale!"
- Post-sale: report showing orders, discount absorbed, GMV lift

## Merchant Email Marketing Tool

Compliance: NDPR (Nigerian Data Protection Regulation) opt-in only

How it works:
- Customers who ordered from a merchant + opted in to merchant communications get added to that merchant's contact list
- Merchant creates email campaigns in portal (via simple drag-drop builder, SendGrid template API)
- Campaign types: Promotion | New Menu Item | Re-engagement | Special Event
- Send: immediately or scheduled
- Analytics: open rate, click rate, orders attributed

Platform enforces:
- Max 2 emails per week per merchant to any customer
- Mandatory unsubscribe link (platform-inserted)
- CAN-SPAM/NDPR compliant footer
- Platform reviews campaign before send (auto-approved if no flagged keywords)

## Merchant Mobile Companion App (V1)

Lightweight React Native app — order management only:

Screens:
1. Login (email + password + 2FA)
2. Home: Open/Closed toggle + today's earnings + pending orders count
3. Orders (Live): list of pending orders with accept/reject
4. Order Detail: items + accept/reject/mark ready
5. Wallet: balance + last 5 transactions
6. Settings: notification preferences + store open/close

Push notifications (FCM):
- New order → sound alert + vibration + notification
- Order cancelled
- Wallet credit
- Payout status

Deep link from notification → opens relevant screen

Tech: React Native Expo + Zustand + React Query + Socket.io client
Distribution: Google Play (Android priority for Nigerian market) + TestFlight

## Multi-Location per Merchant

Data model:
```sql
CREATE TABLE merchant_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id),
  location_name   VARCHAR(200),  -- e.g. "VI Branch", "Lekki Branch"
  address         TEXT,
  city            VARCHAR(100),
  coordinates     GEOGRAPHY(POINT,4326),
  delivery_radius_km NUMERIC(5,2),
  opening_hours   JSONB,
  is_active       BOOLEAN DEFAULT TRUE,
  phone           VARCHAR(20),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

- Each location has own menu visibility (inherit from parent or override)
- Customer sees nearest active location when browsing storefront
- Orders routed to correct location based on customer proximity
- Merchant can manage all locations from single portal account
- Each location has own order stream in live orders board (tabbed)

## Inventory / Stock Management per Item

```typescript
// After order is placed and merchant accepts:
async function decrementStock(orderItems: OrderItem[]) {
  for (const item of orderItems) {
    if (item.menu_item.stock_quantity !== null) {
      await db('menu_items')
        .where({ id: item.menu_item_id })
        .decrement('stock_quantity', item.quantity);

      // Check if now out of stock
      const updated = await db('menu_items').where({ id: item.menu_item_id }).first();
      if (updated.stock_quantity <= 0 && updated.auto_soldout) {
        await db('menu_items')
          .where({ id: item.menu_item_id })
          .update({ is_available: false });

        await notifyMerchant(item.merchant_id, 'item_sold_out', {
          itemName: item.menu_item.name,
        });
      }
    }
  }
}
```

Low stock alert: notify merchant when stock_quantity falls below 5 units.
Merchant restocks by editing item → update quantity → item auto-marks available again.

## Merchant Chat with Platform Support

In-portal live chat:
- Powered by Crisp, Intercom, or custom WebSocket chat (depending on budget)
- Separate from customer support queue — tagged as "Merchant Support"
- Business hours: Mon-Sat 08:00-20:00 WAT
- Outside hours: chatbot handles FAQs + creates support ticket
- Chat history persists in portal
- Support agent can see merchant's wallet, recent orders, application status in sidebar while chatting
