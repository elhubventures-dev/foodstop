# Reference 03 — Merchant Portal Dashboard

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR: [Store Logo + Name] [Open●/Closed] [🔔 3] [👤] │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │           MAIN CONTENT AREA                 │
│  240px   │              max-w-1280px                   │
│          │                                              │
│ Overview │                                              │
│ Orders ▼ │                                              │
│  └ Live  │                                              │
│  └ Hist  │                                              │
│ Menu     │                                              │
│ Wallet   │                                              │
│ Withdraw │                                              │
│ Analytics│                                              │
│ Reviews  │                                              │
│ Promos   │                                              │
│ Settings │                                              │
│ Help     │                                              │
│          │                                              │
│ [Tier    │                                              │
│  Badge]  │                                              │
└──────────┴──────────────────────────────────────────────┘
```

Mobile: sidebar collapses → bottom tab bar (5 tabs: Home, Orders, Menu, Wallet, More)

---

## Screen 1 — Overview Dashboard

### KPI Cards Row (Today / This Week / This Month toggle)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Gross Revenue│ │ Net Earnings │ │ Total Orders │ │ Avg Order    │
│  ₦142,500   │ │  ₦121,125   │ │     38       │ │    ₦3,750   │
│  +12% ↑     │ │  (85% net)  │ │   +5 ↑      │ │    ₦3,200   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Commission   │ │ Avg Rating   │ │ Pending Ord  │ │ Wallet Bal   │
│   ₦21,375  │ │   ⭐ 4.7    │ │      3       │ │  ₦89,450   │
│ Paid to plat │ │  142 reviews │ │  Action now  │ │  Available   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Charts Row
- Left (60%): Revenue vs Commission line chart — dual axis, daily bars for selected period
- Right (40%): Orders by status donut: Completed | Cancelled | Rejected

### Bottom Row
- Left: Top 5 Items (ranked list with revenue contribution bar)
- Center: Peak Hours heatmap (7 rows days × 24 cols hours, heat on orders)
- Right: Live Orders Feed (real-time, last 5, "View All" link)

### Quick Action Bar (below KPIs)
```
[+ Add Menu Item]  [📋 View Live Orders]  [💸 Withdraw Funds]  [🔔 Notifications]
```

---

## Screen 2 — Live Orders Board

Auto-refreshes via WebSocket. Sound alert on new order arrival.

### Kanban Columns
```
NEW ORDER (3)     │  CONFIRMED (2)   │  PREPARING (4)  │  READY (1)
─────────────────   ─────────────────  ────────────────  ─────────────
[Order Card]       [Order Card]       [Order Card]      [Order Card]
  #CF-2047           #CF-2045           #CF-2043          #CF-2041
  Amaka O.           Tunde B.           Chidi E.          Bola A.
  3 items · ₦4,200  2 items · ₦2,800  5 items · ₦7,100  1 item · ₦1,500
  🕐 2 min ago       🕐 8 min ago      🕐 15 min ago     🕐 28 min ago
  [Accept] [Reject]  [Mark Ready]      [Mark Ready]      [Dispatched ✓]
```

### New Order Alert Banner (WebSocket push)
- Slides in from top: "🔔 New Order! #CF-2048 — ₦3,500 — Ngozi A."
- Dismiss or click to jump to order card
- Browser tab title updates: "(3) New Orders | ChopFast Merchant"

### Order Detail Side Panel (click any card)
```
ORDER #CF-2047                              [Print KDS] [×]
──────────────────────────────────────────────────────────
Customer: Amaka O. (••• ••• 7890)  [Reveal on Accept]
Type: Delivery  |  Payment: Paid via Paystack Card

ITEMS:
  Jollof Rice (Large) × 1          ₦2,500
    + Extra chicken                  +₦500
  Zobo Drink × 2                   ₦1,200
                                  ────────
  Food Subtotal:                   ₦4,200
  Platform Commission (15%):        -₦630
  YOUR EARNINGS:                   ₦3,570

Special instructions: "Please add extra pepper"
Estimated prep time: [__] minutes  (merchant sets this)

ADDRESS: 14 Akin Adesola St, VI, Lagos
         [View on Map]

                [✗ REJECT]        [✓ ACCEPT ORDER]
```

### Reject Order Modal
```
Reason (required):
  ○ Item(s) unavailable
  ○ Too busy right now
  ○ Restaurant closing soon
  ○ Other: [text input]

[Cancel]  [Confirm Rejection]
```
Customer receives automatic SMS/push: "Sorry, [Merchant] couldn't take your order. You won't be charged."

---

## Screen 3 — Order History

Table columns: Order ID | Customer | Date/Time | Items | Gross | Commission | Net | Status | Actions

Filters: Date range | Status (all/completed/cancelled/rejected) | Search by ID or customer

Actions per row: View details | Reprint receipt | Report issue

Export: CSV | PDF

---

## Screen 4 — Menu Management

### Category List (left sidebar within menu page)
- Drag-to-reorder categories
- Click category → items show in right panel
- [+ Add Category] button
- Edit category name inline
- Toggle category availability (open/close whole section)
- Delete category (shows warning if items exist)

### Items Panel (right)
- Grid or list view toggle
- Per item card: image thumbnail, name, price, availability toggle (on/off), edit icon, delete icon
- [+ Add Item] → opens item form drawer

### Item Form Drawer
```
Name:            [____________________]
Category:        [dropdown]
Price (₦):       [________]
Sale Price (₦):  [________] (optional, shows strikethrough)
Description:     [rich text area, max 300 chars]
Image:           [drag-drop upload → Cloudinary]
                 [Preview thumbnail]
Availability:    [● Available / ○ Sold Out]
Stock Quantity:  [____] (leave blank = unlimited)
Auto-mark sold out when stock = 0: [☑]
Badges:          [☐ Bestseller] [☐ Chef's Pick] [☐ New] [☐ Limited]
Prep Time:       [____] minutes
Dietary:         [☐ Halal] [☐ Vegetarian] [☐ Gluten-Free] [☐ Spicy]
Spice Level:     [🌶 Mild / 🌶🌶 Medium / 🌶🌶🌶 Hot / 🌶🌶🌶🌶 Extra Hot]

MODIFIERS (Option Groups):
  [+ Add Option Group]
  e.g. Group: "Choose your protein"
    Required: Yes | Max selections: 1
    Options: [Chicken +₦0] [Beef +₦200] [Goat +₦400] [Fish +₦300]

Visibility:
  ○ Always available
  ○ Available during: [Breakfast 06-11] [Lunch 11-16] [Dinner 16-23]

[Cancel]  [Save Item]
```

### Bulk Actions
- Select multiple items → toggle all available/unavailable
- Delete multiple
- Move to different category

### CSV Import
```
1. Download template button → chopfast_menu_template.csv
2. Upload completed CSV
3. Preview parsed results (table showing what will be imported)
4. Confirm import
5. After import: upload images per item inline
```

---

## Screen 5 — Wallet Overview

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR CHOPFAST WALLET                                        │
│                                                              │
│  Available Balance         Pending Balance                   │
│  ₦89,450.00               ₦12,300.00                       │
│  [Withdraw Now]            Releases in ~1h 42m              │
│                                                              │
│  Lifetime Earned: ₦2,341,800  |  Commission Paid: ₦351,270 │
│  Total Withdrawn: ₦2,240,080  |  Net Lifetime:   ₦101,720  │
└─────────────────────────────────────────────────────────────┘

RECENT TRANSACTIONS
──────────────────────────────────────────────────────────────
Type           Order       Gross      Commission   Net       Status
─────────────────────────────────────────────────────────────
✅ Credit      #CF-2047   ₦4,200     -₦630       +₦3,570   Pending
✅ Credit      #CF-2044   ₦6,800     -₦1,020     +₦5,780   Completed
💸 Withdrawal  REF-8821    —           —          -₦50,000  Completed
✅ Credit      #CF-2039   ₦2,500     -₦375       +₦2,125   Completed
❌ Refund Ded  #CF-2031   ₦3,200     +₦480       -₦2,720   Completed
```

Filter by: type | date range | status
Export: CSV | PDF Statement

---

## Screen 6 — Withdrawal Flow

### Step 1 — Initiate
```
WITHDRAW FUNDS
──────────────────────────────────────────
Available Balance: ₦89,450.00

Amount to withdraw: ₦ [__________]
Min: ₦1,000  |  Max: ₦89,450

Withdraw to:
  ● GTBank — 0123456789 — Emeka Okafor  [default]
  ○ Access Bank — 9876543210 — Emeka Okafor
  ○ [+ Add New Bank Account]

Processing time: 1-3 business days
Minimum withdrawal: ₦1,000

[Cancel]  [Continue →]
```

### Step 2 — OTP Confirmation
```
VERIFY WITHDRAWAL

We sent a 6-digit code to +234 80X XXX X890

[_][_][_][_][_][_]

Resend in 0:54

[← Back]  [Confirm Withdrawal]
```

### Step 3 — Success
```
✅ Withdrawal Initiated!

₦50,000.00 is on its way to
GTBank — Emeka Okafor

Reference: WD-2025-09-0082
Expected: 1-3 business days

You'll be notified by SMS and email when it arrives.

[View Withdrawal History]  [Back to Dashboard]
```

---

## Screen 7 — Analytics

Tabs: Sales | Items | Customers | Commission

### Sales Tab
- Revenue line chart (daily/weekly/monthly — date range picker)
- Breakdown table: orders, gross, commission, net per period
- By order type: Delivery vs Pickup pie chart
- Avg order value trend

### Items Tab
- Top performers: ranked by orders and by revenue (separate views)
- Worst performers: flagged for review
- Sales by category bar chart
- Item-level table: name, orders, revenue, avg rating

### Customers Tab
- New vs returning customers trend
- Top 10 customers by spend (anonymized: "Customer A — ₦42,000")
- Location heatmap (Lagos map with dot density by delivery zone)
- Peak order times: hour × day heatmap

### Commission Tab
- Total commission paid trend chart
- Per-order commission log table
- Monthly commission summary (exportable for accounting)

---

## Screen 8 — Reviews & Ratings

```
Average Rating: ⭐ 4.7 (142 reviews)
Distribution:
  5⭐ ████████████████ 78%
  4⭐ ████            18%
  3⭐ █                3%
  2⭐                   1%
  1⭐                   0%

REVIEWS FEED
──────────────────────────────────────────────────────────────
⭐⭐⭐⭐⭐  Ngozi A. — Order #CF-2044 — 2 hours ago
"Jollof rice was fire! Will definitely order again."
[Reply] [Flag]

  Merchant reply: "Thank you Ngozi! Come back soon 🙏"

⭐⭐⭐      Tunde B. — Order #CF-2038 — 1 day ago
"Food was good but arrived late."
[Reply ▼] [Flag]

  [Type your reply...]  [Post Reply]
```

---

## Screen 9 — Store Settings

Tabs: Profile | Hours | Delivery | Notifications | Team | Security

### Profile Tab
- Logo upload (circular crop preview)
- Banner upload (rectangular preview at storefront aspect ratio)
- Business name (change requires admin approval notice)
- Tagline, description (rich text), cuisine types, price range indicator
- Minimum order amount, average prep time
- [Save Changes]

### Hours Tab
- Per-day toggle: [Mon ●] [Tue ●] [Wed ●] [Thu ●] [Fri ●] [Sat ●] [Sun ○]
- Per-day time pickers: Open [08:00 ▼] Close [22:00 ▼]
- [+ Add Special Hours] → date picker + custom hours (for holidays)
- Temporary Closure toggle: [🔴 Temporarily Close Store] → set return date

### Delivery Tab
- Delivery radius: interactive map with draggable circle
- Uses platform riders: ● Yes / ○ No (own riders)
- Pickup enabled: [☑]
- Dine-in enabled: [☑]
- Delivery notes (shown to customers): [textarea]

### Team Tab
- Active members table: name | email | role | joined | status | actions
- [Invite Team Member]: email + role dropdown → sends invitation email
- Deactivate member: removes portal access
- Activity log: last login, recent actions per member

### Security Tab
- Change password
- Two-factor authentication toggle (SMS OTP)
- Active sessions list (device, IP, last seen) + "Sign out all other sessions"
- API key (read-only, for Zapier/webhook integrations — optional)
