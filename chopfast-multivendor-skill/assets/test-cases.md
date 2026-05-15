# Skill Test Cases
# chopfast-multivendor-marketplace

## How to use these tests
# Paste each prompt into Cursor / Antigravity / Windsurf with this skill active.
# The expected output column describes what the AI builder should produce.

---

## TEST CASE 01 — Database Migration
Prompt:
  "Using the ChopFast multi-vendor skill, generate the complete PostgreSQL
   migration file to add multi-vendor support to the existing ChopFast database.
   Include all new tables, all existing table alterations, and the seed migration
   to convert the original restaurant to merchant_id = 1."

Expected output:
  - Single .sql migration file
  - Creates all tables listed in references/01-database-commission.md
  - ALTER TABLE statements for menu_categories, menu_items, orders, order_items
  - CREATE INDEX statements on all merchant_id columns
  - Seed INSERT + UPDATE statements for existing data
  - No data loss risk (all ADD COLUMN IF NOT EXISTS)
  - Transaction-wrapped (BEGIN / COMMIT)

---

## TEST CASE 02 — Commission Engine
Prompt:
  "Using the ChopFast multi-vendor skill, implement the full commission engine
   service in TypeScript/NestJS. It should fire when an order is marked DELIVERED,
   split 15% to platform and 85% to merchant pending wallet, schedule a 2-hour
   release job, and handle the dispute hold extension."

Expected output:
  - commission.service.ts with processOrderCommission() function
  - Correct math: commission on food subtotal only (not delivery fee / VAT)
  - db.transaction() wrapping all writes
  - BullMQ or pg-boss job scheduling for release
  - Dispute check before releasing pending balance
  - VAT (7.5%) logged separately in platform_commission_ledger
  - notifyMerchant() call after processing

---

## TEST CASE 03 — Merchant Registration API
Prompt:
  "Using the ChopFast multi-vendor skill, build the full merchant registration
   API endpoint (POST /api/merchant/register). It should handle the 5-step
   registration payload, validate Nigerian phone format, verify OTP, upload
   documents to Cloudinary, verify bank account via Paystack resolve API,
   and create all required database records."

Expected output:
  - Express/NestJS route handler
  - Zod or Joi validation schema for all 5 steps
  - Nigerian phone regex: /^(\+234|0)[789][01]\d{8}$/
  - Termii SMS OTP send + Redis storage
  - Paystack account resolve API call
  - Creates: merchant, merchant_documents, merchant_wallets, merchant_tiers records
  - Returns application reference
  - Sends confirmation email + SMS

---

## TEST CASE 04 — Withdrawal Flow
Prompt:
  "Using the ChopFast multi-vendor skill, implement the complete withdrawal
   flow: the request endpoint, OTP gate, Paystack Transfer initiation, and
   both webhook handlers (transfer.success and transfer.failed). Include
   automatic balance restoration on failure."

Expected output:
  - withdrawal.service.ts with all methods from references/04-wallet-payouts.md
  - OTP send + verify endpoints
  - Paystack recipient creation + transfer initiation
  - Webhook handler with HMAC signature validation
  - handleTransferSuccess: marks completed, increments total_withdrawn, sends SMS
  - handleTransferFailed: restores balance, logs reversal, notifies merchant
  - All wrapped in db.transaction()

---

## TEST CASE 05 — Live Orders Kanban Board
Prompt:
  "Using the ChopFast multi-vendor skill, build the Live Orders Kanban board
   React component for the merchant portal. It should connect via Socket.io
   to the /merchant namespace, display orders in 4 columns (New/Confirmed/
   Preparing/Ready), show a slide-in alert on new orders with sound, and
   include the full order detail panel with accept/reject actions."

Expected output:
  - React component with 4-column Kanban layout
  - Socket.io client hook connecting to /merchant namespace
  - useEffect subscribing to 'new_order' and 'order_status_update' events
  - Alert sound using Web Audio API or Audio element
  - Browser tab title update with order count
  - Order detail side panel with full breakdown
  - Commission breakdown display (gross / platform fee / your earnings)
  - Accept (with prep time input) and Reject (with reason modal) actions
  - Optimistic UI updates

---

## TEST CASE 06 — Restaurant Discovery Page
Prompt:
  "Using the ChopFast multi-vendor skill, build the /restaurants customer
   discovery page in Next.js. It should show a grid of merchant cards with
   filters (open now, cuisine type, rating, distance), sort options, featured
   sections, and use the customer's geolocation to calculate distances."

Expected output:
  - Next.js page component with SSR or ISR (revalidate: 60)
  - Merchant card component matching design spec in references/06-to-10-combined.md
  - Filter sidebar/sheet component with all specified filter types
  - "Open Now" logic using merchant opening_hours JSONB
  - Geolocation hook (navigator.geolocation + fallback to IP location)
  - Featured sections: Featured | New on ChopFast | Top Rated | Fast Delivery
  - Distance calculation using Haversine formula or PostGIS
  - Infinite scroll or pagination
  - Loading skeleton cards

---

## TEST CASE 07 — Wallet Overview Screen
Prompt:
  "Using the ChopFast multi-vendor skill, build the wallet overview screen
   for the merchant portal. Show available and pending balances, a transaction
   ledger table with filters, and a withdrawal initiation flow with OTP
   confirmation step."

Expected output:
  - Wallet summary cards (available_balance, pending_balance, lifetime stats)
  - Currency formatted with JetBrains Mono font
  - Transaction table: type icon, description, order ref, gross, commission, net, status, date
  - Filter controls: type dropdown, date range picker, status filter
  - Export CSV + PDF buttons
  - Withdraw button → multi-step flow matching references/03-merchant-portal.md Screen 6
  - OTP input component (6 individual boxes)
  - Success/failure states

---

## TEST CASE 08 — Admin Merchant Application Queue
Prompt:
  "Using the ChopFast multi-vendor skill, build the merchant application review
   queue in the super admin panel. Show all pending applications with SLA
   tracking, an inline document viewer, and approve/reject/request-more-info
   actions."

Expected output:
  - Data table with SLA badge (green/yellow/red based on hours elapsed)
  - Click row → review screen with two-panel layout
  - Left panel: all application fields displayed
  - Right panel: document viewer (PDF iframe + image lightbox)
  - Approve action: triggers /api/admin/merchants/:id/approve, sends email + SMS
  - Reject action: reason selector + optional note + email send
  - Request More Info: free-text message sent to merchant
  - Status filter tabs: All | Pending | Approved | Rejected

---

## TEST CASE 09 — Platform Financials Dashboard
Prompt:
  "Using the ChopFast multi-vendor skill, build the platform financials
   dashboard in the super admin panel. Show GMV, commission collected, payout
   volume, and net revenue KPIs. Include a revenue by merchant leaderboard
   chart and a VAT report export function."

Expected output:
  - 6 KPI cards with period selector (today/week/month/year/custom)
  - Recharts LineChart: GMV vs Commission trend
  - Horizontal BarChart: Top 20 merchants by GMV
  - Payout summary: total processed, pending, failed
  - VAT Reports section: quarter + year selector → generates + downloads PDF
  - Export full financial report button (CSV + PDF)
  - All currency values in JetBrains Mono font

---

## TEST CASE 10 — End-to-End Commission Accuracy
Prompt:
  "Using the ChopFast multi-vendor skill, write a Jest unit test suite for
   the commission engine. Test: correct 15% split, food subtotal exclusion
   of delivery fee and VAT, cancellation before acceptance (0% commission),
   cancellation after acceptance (5% commission), refund clawback, and
   Gold tier merchant at 11% commission rate."

Expected output:
  - Jest test file: commission.service.test.ts
  - Mock db and walletService
  - Test: 15% of food subtotal = correct commission
  - Test: delivery_fee + VAT NOT included in commission basis
  - Test: cancelled before accept → zero commission debited
  - Test: cancelled after accept → 5% charged
  - Test: refund → merchant net debited, commission returned
  - Test: gold tier merchant → 11% rate applied from merchant.commission_rate
  - All tests passing with realistic Nigerian Naira amounts
