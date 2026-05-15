# Reference 04 — Merchant App (ng.chopfast.merchant)

## Navigation Structure
```
Bottom Nav:
  Tab 1 → Dashboard    (KPIs, quick actions, earnings)
  Tab 2 → Orders       (Live Kanban + history)
  Tab 3 → Menu         (CRUD + availability)
  Tab 4 → Wallet       (Balance + withdrawals)
  Tab 5 → More         (Analytics, Reviews, Settings, Help)

Special mode:
  KDS Mode → full-screen tablet kitchen display (PIN locked)
```

---

## Feature #11 — Kitchen Display System (KDS) Mode

```dart
// Activated from Dashboard → "Switch to KDS Mode"
// PIN protection (separate 4-digit PIN from account password)
// Full-screen landscape layout (tablet optimised, also works on phone)
// No navigation bar — only orders, nothing else

class KDSScreen extends ConsumerWidget {
  // 3 columns: CONFIRMED | PREPARING | READY
  // Each order card: large font (readable from 3m away)
  //   - Order number (huge, e.g. "#047")
  //   - Item list (large text)
  //   - Prep timer (counts up from order accepted)
  //   - One-tap status advance: → Preparing → Ready → Done
  // Sound alert on new order (loud, kitchen-appropriate)
  // Never dim or sleep while in KDS mode (Wakelock)
  // Exit KDS: hold back button 3s → PIN entry

  // Color coding:
  // CONFIRMED: blue cards
  // PREPARING: amber cards (< 15 min), red cards (> 15 min — overdue)
  // READY: green cards (waiting for rider)
}
```

---

## Feature #12 — Revenue Home Screen Widget

```dart
// Android: AppWidget via home_widget package
// iOS: WidgetKit extension

// Small widget (2x1): "Today ₦24,500 | 12 orders"
// Medium widget (2x2): Revenue + pending orders + store status toggle
// Updates every 15 minutes via background fetch
// Tapping widget → opens merchant app to dashboard

// Implementation:
// 1. Backend: /merchant/widget-data endpoint (lightweight, fast)
// 2. app/merchant/android/app/src/main/.../ChopFastWidget.kt
// 3. app/merchant/ios/MerchantWidget/ (WidgetKit extension)
// 4. home_widget package bridges Flutter ↔ native widget data
```

---

## Feature #13 — Menu Photo Shoot Mode

```dart
// In Menu → Add Item → "Use Photo Shoot Mode"
class PhotoShootModeScreen extends StatefulWidget {
  // Camera viewfinder with overlay guides:
  //   - Square crop guide (1:1 for menu items)
  //   - "Centre the dish" alignment guide (plate circle overlay)
  //   - "Avoid shadows" realtime brightness meter
  //   - "Good lighting ✓ / Too dark ✗" indicator

  // Tips shown contextually:
  //   "Shoot from directly above for best results"
  //   "Use natural light if possible"
  //   "Fill the frame with your dish"

  // After capture:
  //   - Auto-crop to 1:1 square
  //   - Auto-enhance: brightness +10%, saturation +15% (food photography standard)
  //   - Preview before accepting
  //   - One-tap upload to Cloudinary → returns URL for menu item
}
```

---

## Feature #14 — Voice Order Alerts

```dart
// Uses flutter_tts package
// Activated in Settings → Notifications → Voice Alerts (toggle)
// Customisable voice volume

// On new order received (foreground):
await flutterTts.speak(
  "New order. ${order.itemCount} item${order.itemCount > 1 ? 's' : ''}. "
  "${order.total.toNaira()}."
);

// On background notification received:
// Native push notification with custom sound (kitchen bell .mp3)
// Notification body: "New Order — ₦4,200 — 3 items"

// Platform-specific:
// Android: use full-volume alarm channel for order alerts
// iOS: critical notification entitlement (always plays even in silent mode)
//      (requires Apple entitlement approval)
```

---

## Feature #15 — Inventory Camera Scanner

```dart
// In Menu → Item → Edit → Stock → "Scan Barcode"
// Uses mobile_scanner package (camera barcode reader)
// Scans: EAN-13, EAN-8, QR Code, Code 128
// On scan: looks up item in merchant's menu by barcode
//   - Found: opens item with [+stock] input pre-focused
//   - Not found: offers to create new menu item with this barcode
// Fast scanning mode: continuous scan, beep on each read
// Inventory restock workflow:
//   Camera → scan item → enter new quantity → confirm → next item
//   Full stock count: scan all items, bulk update in one API call
```

---

## Merchant App — Live Orders (WebSocket Kanban)

```dart
// Same logic as web portal Kanban but mobile-optimised
// Swipeable cards: swipe right to confirm, swipe left to reject
// Haptic feedback on every state change
// Full-screen order detail on card tap
// Prep timer input (stepper widget: +5 min increments)
// "Order incoming" shake animation when new order arrives
// Tab badges: "New (3)" in red on Orders tab
```

---

## Merchant App — Wallet & Withdrawals

```dart
// Wallet overview: balance cards (same data as web)
// Withdrawal: multi-step with OTP (same flow as web, mobile-native UI)
// Bank account management
// Transaction list with pull-to-refresh

// Biometric confirm for withdrawals:
// After OTP: "Confirm with Face ID / Fingerprint" → local_auth
// Extra security layer for financial actions
```

---

# Reference 05 — Rider App (ng.chopfast.rider)

## Navigation Structure
```
Tab 1 → Home          (Online/offline toggle, earnings today, incoming requests)
Tab 2 → Navigation    (Active delivery map — only shows when delivery in progress)
Tab 3 → Earnings      (Daily/weekly/monthly + zone heatmap)
Tab 4 → History       (Past deliveries)
Tab 5 → Profile       (Documents, ratings, bank account, SOS contacts)
```

---

## Rider Home Screen
```dart
// Dominant element: large ONLINE/OFFLINE toggle (50% of screen)
// When OFFLINE: grey screen, "Go online to start receiving orders"
// When ONLINE: green glow, "Waiting for orders nearby..."

// Stats row: Today ₦8,200 | 12 deliveries | ⭐ 4.9
// Current streak card (Feature #16): "🔥 4 in a row! 1 more for ₦500 bonus"
// Incoming order sheet (bottom sheet, slides up): 15-second accept timer
//   - Restaurant name + address
//   - Delivery address + distance
//   - Estimated payout ₦650
//   - [✗ Decline] [✓ Accept] — large buttons
//   - Circular countdown progress ring
```

---

## Feature #16 — Earnings Streak Bonuses

```dart
// Streak: consecutive deliveries without cancellation/rejection
// Milestones:
//   5 in a row  → ₦500 bonus credited to wallet
//   10 in a row → ₦1,200 bonus
//   20 in a row → ₦3,000 bonus + "Hot Streak 🔥" badge
// Reset on: cancellation, rejection, going offline during active delivery
// Streak displayed on home screen (fire emoji + count)
// Milestone reached: full-screen celebration animation + wallet credit
```

---

## Feature #17 — SOS Safety Button

```dart
// Always accessible: floating red button on active delivery screen
// Long-press 2s to activate (prevent accidental triggers)

class SOSButton extends StatefulWidget {
  // Activation flow:
  // 1. 2s long press → vibration + "SOS Activating in 3... 2... 1..."
  // 2. Confirm: "Send SOS?" → [Cancel] [SEND SOS]
  // 3. On confirm:
  //    a. Send rider GPS location to platform ops via API
  //    b. Send SMS to rider's 2 emergency contacts
  //       "EMERGENCY: [RiderName] may need help. Location: [Google Maps link]"
  //    c. In-app: ops team receives push alert + can initiate call
  //    d. Rider sees: "SOS Sent. Help is on the way. Stay calm."
  // 4. Auto-send location updates every 60s until rider cancels

  // Emergency contacts set in Profile → Safety → Emergency Contacts
  // Minimum 1 required for rider account approval
}
```

---

## Feature #18 — Rider-to-Rider Chat

```dart
// Available in-app: Home → Nearby Riders → Message
// Shows riders within 2km radius (privacy: only first name + zone shown)
// Quick messages: "Anyone near Lekki Phase 1?"
//                 "Heads up: traffic on Ozumba Mbadiwe"
//                 "Anyone want to swap this order? I'm near Ikoyi"
// Text messages only, no media
// Platform moderated: reported messages reviewed by ops team
// Not for personal chatting — focus on delivery coordination
// Message history: deleted after 24 hours
```

---

## Feature #19 — Delivery Zone Heatmap

```dart
class ZoneHeatmapScreen extends ConsumerWidget {
  // Google Maps base with heatmap overlay
  // Heatmap data: order density by zone for current hour
  // Color scale: cool (blue/green = few orders) → hot (red = many orders)
  // Updates every 5 minutes
  // Current position marker shows where rider is
  // Legend: "More orders →" gradient bar
  // Time filter: Now | Next Hour | Typical for this time of day
  // Tap on zone: "This zone usually has 15 orders/hr on Friday evenings"
  // "Navigate here" button to move toward high-demand zones
}
```

---

## Feature #20 — Fuel/Expense Tracker

```dart
// In Earnings tab → Expenses
class ExpenseTrackerScreen extends ConsumerWidget {
  // Log expense: type (Fuel, Food, Maintenance, Other) + amount + note
  // Today's expenses vs earnings: net income calculation
  // Weekly expense chart
  // Monthly report: gross earnings - expenses = take-home
  // Export as CSV (for tax/self-employment records)
  // Reminder: "You haven't logged expenses today" (optional notification)

  // Quick log: Home screen widget → tap expense type → enter amount → done
}
```

---

## Active Delivery Flow

```dart
// Step 1: Navigate to restaurant
//   - Map with route to restaurant
//   - Restaurant address + name + estimated arrival
//   - [Arrived at Restaurant] button

// Step 2: Pickup from restaurant
//   - Order summary (item names, special notes)
//   - [Confirm Pickup] button → status: dispatched
//   - Contact restaurant: [Call] button

// Step 3: Navigate to customer
//   - Map with route to delivery address
//   - Customer landmark note shown prominently
//   - ETA countdown

// Step 4: Deliver
//   - [Arrived at Customer] button
//   - Contact customer: [Call] [WhatsApp] buttons
//   - If no answer: photo capture of package at door → [Mark Delivered]
//   - E-signature option (premium merchants)
//   - [Order Delivered] → earnings credited, next order available
```

---

# Reference 06 — Super Admin App (ng.chopfast.admin)

## Navigation Structure
```
Tab 1 → Command Center   (Live city operations map)
Tab 2 → Merchants        (Applications, management, actions)
Tab 3 → Financials       (Revenue, payouts, commission)
Tab 4 → Alerts           (Anomaly alerts, fraud flags)
Tab 5 → Settings         (Platform config, broadcasts)
```

---

## Feature #21 — Operations Command Center

```dart
class CommandCenterScreen extends ConsumerWidget {
  // Full-screen Google Map of Nigerian city (Lagos/Abuja default)
  // Live dots refreshed every 10 seconds via WebSocket:
  //   🟢 Green dot: active rider (moving)
  //   🟡 Yellow dot: rider idle/waiting
  //   🍽️ Restaurant pin: open merchant
  //   📦 Order pin: active order in transit (line connecting merchant → rider → customer)

  // Stats ribbon at top:
  //   Active Orders: 47 | Riders Online: 23 | Merchants Open: 31

  // Tap any dot → info sheet slides up:
  //   Rider: name, rating, current order, earnings today
  //   Merchant: name, open status, orders today, pending issues
  //   Order: status, ETA, merchant, rider, customer zone

  // City selector: [Lagos ▼] → switches map focus and data
  // Alert badge: red dot on tab if anomaly detected
  // Heatmap toggle: shows customer density (order demand map)
}
```

---

## Feature #22 — Anomaly Alert System

```dart
// Monitored anomalies (all configurable in platform settings):
const ANOMALY_RULES = [
  AnomalyRule(
    id: 'order_spike',
    description: 'Order volume > 2x normal for this hour',
    severity: Severity.info,    // Positive anomaly — might need more riders
    action: 'Notify ops team, consider rider incentive push',
  ),
  AnomalyRule(
    id: 'merchant_sudden_offline',
    description: 'Active merchant stops accepting orders unexpectedly',
    severity: Severity.warning,
    action: 'Auto-call merchant, notify ops',
  ),
  AnomalyRule(
    id: 'rider_stationary',
    description: 'Rider GPS unchanged for 20+ minutes during active delivery',
    severity: Severity.high,
    action: 'Notify ops, attempt contact, consider SOS check',
  ),
  AnomalyRule(
    id: 'payment_failure_spike',
    description: 'Payment failure rate > 5% in last 30 minutes',
    severity: Severity.critical,
    action: 'Check Paystack status, notify engineering',
  ),
  AnomalyRule(
    id: 'low_rider_coverage',
    description: 'Zone has active orders but no riders within 5km',
    severity: Severity.high,
    action: 'Push notification to idle riders near zone',
  ),
];

// Alert detail screen:
// Title + description + affected entities (list of merchants/riders/orders)
// Recommended action (from rule config)
// [Dismiss] [Take Action] → action-specific quick form
// Alert history log (last 30 days)
```

---

## Feature #23 — One-Tap Merchant Actions

```dart
// Merchant list: searchable, filterable by status/city
// Swipe right on merchant card: [✓ Approve] (for pending applications)
// Swipe left on merchant card: [⚠️ Suspend]
// Tap merchant → detail sheet with:
//   - Store status toggle (open/closed override)
//   - Commission rate edit
//   - [Send Message] → push notification + SMS to merchant
//   - [Approve] / [Suspend] / [Unsuspend] with reason
//   - Wallet balance display + [Manual Adjustment]
//   - Quick links: View Orders | View Wallet | View Documents

// Biometric auth required for: approve, suspend, wallet adjustment
```

---

# Reference 07 — Standalone Apps

## A. Driver Partner App (ng.chopfast.driver)

### Concept
Fleet owners (individuals with multiple motorcycles/cars, transport companies)
register a fleet account. They assign riders to their fleet and earn a cut
of each rider's deliveries. Platform earns from the rider's normal commission.

### Navigation
```
Tab 1 → Dashboard    (Fleet overview, today's earnings)
Tab 2 → Fleet        (Riders list, assignments)
Tab 3 → Earnings     (Fleet revenue, per-rider breakdown)
Tab 4 → Analytics    (Zone performance, peak times)
Tab 5 → Profile      (Business profile, bank account, documents)
```

### Key Screens

**Fleet Dashboard**
- Active riders count (online now)
- Fleet earnings today (sum of all riders' completed deliveries)
- Map showing all fleet riders' live positions
- Best performing rider today (name + earnings)

**Rider Management**
- Invite rider by phone number → rider gets SMS to join fleet
- Per-rider card: name, photo, online status, today's earnings, rating
- Set revenue split per rider (e.g. 80% rider / 20% fleet owner)
- Remove rider from fleet

**Fleet Earnings**
- Total fleet gross earnings
- Platform commission deducted from each rider (normal 15% on order)
- Fleet owner's cut per rider (configured per rider)
- Payout to fleet owner's bank account (weekly batch)

**Fleet Analytics**
- Which zone generates most deliveries for fleet
- Which rider is most efficient (deliveries/hour)
- Peak demand times for fleet's operating zone
- Revenue trend: daily/weekly/monthly

---

## B. ChopFast for Business — B2B App (ng.chopfast.business)

### Concept
Corporate accounts for companies ordering meals for employees.
HR/Office managers set up company account, invite employees,
set spending limits, and get monthly invoices. Replaces expense
claims for team lunches, meeting meals, company events.

### Navigation
```
Tab 1 → Home         (Quick order, recent orders, announcements)
Tab 2 → Order        (Browse restaurants, place order)
Tab 3 → Team         (Employee management, limits)
Tab 4 → Invoices     (Monthly billing, reports)
Tab 5 → Profile      (Company settings, approval workflow)
```

### Key Features

**Employee Roles:**
- **Company Admin** — sets limits, manages team, approves large orders, views all spending
- **Department Manager** — can approve orders up to their budget, view team spending
- **Employee** — orders within their daily/weekly limit (no approval needed below threshold)

**Spending Controls:**
```
Per employee: daily limit ₦X, weekly limit ₦Y
Per department: monthly budget ₦Z
Order above limit: auto-request approval → manager gets push notification
Company meal policy: "Delivery only to office address" toggle
Allowed merchants: whitelist specific restaurants only (optional)
Allowed categories: "No alcohol" enforcement (optional)
```

**Order Flow for Employee:**
1. Open app → Home shows "Your daily balance: ₦2,500 remaining"
2. Browse restaurants (company-approved if filtered)
3. Add items → at checkout: charge to "Company Account" toggle
4. If within limit: places immediately
5. If over limit: "Approval required" → manager gets notification → approve/reject

**Invoice & Reporting (Admin):**
- Monthly invoice PDF: itemised per employee, per department
- Export: CSV for accounting
- Spend by department (bar chart)
- Most ordered restaurants
- "Meal budget utilisation" — are employees using their allowance?

**Integration:**
- Company login: Google Workspace SSO (sign_in_with_google scoped to company domain)
- Invoices: auto-emailed to company billing email on 1st of each month
- Payment: company credit line (post-paid) or prepaid company wallet

---

## C. Affiliate App (ng.chopfast.affiliate)

### Concept
Content creators, food bloggers, influencers, and everyday users
earn commissions by referring customers to ChopFast. They get a
unique link/code. When someone orders using their link, they
earn ₦X per order (or % of order value).

### Commission Structure
- Standard affiliate: ₦200 per new customer first order
- Premium affiliate (1,000+ referrals): ₦350 per new + ₦50 per repeat order
- Tier up: 10 referrals → Standard | 100 referrals → Silver | 500 → Gold | 1,000 → Premium

### Navigation
```
Tab 1 → Dashboard    (Earnings today, total, recent conversions)
Tab 2 → My Links     (Unique links, custom codes, QR codes)
Tab 3 → Performance  (Clicks, conversions, conversion rate)
Tab 4 → Earnings     (History, pending, available)
Tab 5 → Payouts      (Bank account, withdrawal history)
```

### Key Screens

**Dashboard**
- Earnings today: ₦1,400 (7 conversions)
- Earnings this month: ₦42,600
- Total lifetime: ₦218,900
- Active referrals: 312 customers referred
- Commission rate badge: "Gold Affiliate — ₦350/new customer"

**My Links Screen**
```dart
class MyLinksScreen extends ConsumerWidget {
  // Primary link: "chopfast.ng/a/yourname" → tap to copy
  // QR code: tap to view full-screen → save to photos → share on Instagram
  // Custom UTM links:
  //   [+ Create Link] → give it a label (e.g. "Instagram Bio", "TikTok")
  //   Each link tracks clicks + conversions separately
  //   Useful for seeing which platform drives most orders

  // Share shortcuts:
  //   [WhatsApp] [Instagram Story] [TikTok Bio] [Copy Link]
}
```

**Performance Analytics**
- Total clicks: 4,821 (last 30 days)
- Conversions: 312 (6.5% conversion rate)
- Best performing channel: Instagram (chart)
- Top referring post (if tracking enabled)
- Daily conversion chart (line graph)

**Payout Screen**
- Available balance: ₦42,600
- Pending (awaiting 7-day hold): ₦8,400
- Minimum withdrawal: ₦5,000
- Bank account + [Withdraw] button
- Transaction history

**Content Tools (Bonus Feature)**
- Pre-made promotional templates: banners, captions, WhatsApp messages
- "Download assets for your next food post"
- Seasonal promotions: "Use these assets for Sallah/Christmas food deals"
