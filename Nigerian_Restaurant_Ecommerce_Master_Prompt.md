# 🍽️ MASTER BUILD PROMPT
## Nigerian Restaurant E-Commerce Platform — Full-Stack Web & Mobile App
### For: AI UI/UX Builders (Google Stitch, Galileo AI, Uizard, Framer AI) + AI Code Builders (Cursor, Windsurf, Bolt, Lovable, v0, Replit Agent)

---

## 🧭 PROJECT OVERVIEW

Build a **complete, production-ready, full-stack e-commerce restaurant platform** for a Nigerian restaurant brand. This is not a prototype or wireframe — it is a deployable, market-ready product.

The platform must include:
1. **Public-facing Marketing & Ordering Website** (Web App)
2. **Customer Mobile App** (iOS + Android via React Native or Flutter)
3. **Customer Dashboard** (web + in-app)
4. **Rider/Delivery Agent Dashboard & App**
5. **Restaurant Admin Dashboard** (full back-office)
6. **Super Admin Panel** (platform-level control)

**Target Market:** Nigeria — must deeply reflect Nigerian culture, cuisine, payment infrastructure (Paystack, Flutterwave), and delivery logistics context.

**Brand Direction:**
- Name placeholder: **"ChopFast"** *(swap for real brand name)*
- Tone: Warm, energetic, modern, culturally rooted
- Aesthetic: Bold West African warmth — deep terracotta, saffron yellow, forest green, rich charcoal, and cream white. Evokes Afro-futurism meets street food culture
- Typography: Pair a bold geometric display font (e.g. Clash Display or Cabinet Grotesk) with a clean, legible body font (e.g. Satoshi or DM Sans)
- Logo style: Wordmark + icon (a stylized bowl or flame motif)
- Photography direction: real Nigerian food imagery — jollof rice, egusi soup, suya, puff puff, pepper soup, etc.

---

## ⚙️ TECH STACK RECOMMENDATION

| Layer | Technology |
|---|---|
| Frontend Web | Next.js 14+ (App Router) + Tailwind CSS + Framer Motion |
| Mobile App | React Native (Expo) or Flutter |
| Backend/API | Node.js + Express or NestJS (REST + WebSocket) |
| Database | PostgreSQL (primary) + Redis (caching/sessions) |
| Auth | JWT + Refresh Tokens + OAuth (Google, Apple) |
| Payments | Paystack (primary), Flutterwave (fallback), cash on delivery |
| File Storage | Cloudinary or AWS S3 |
| Real-time | Socket.io (order tracking, chat) |
| Maps | Google Maps API or Mapbox (delivery tracking) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Email | Nodemailer + SendGrid |
| SMS | Termii or Twilio Nigeria |
| Deployment | Vercel (web), Railway or Render (API), Expo EAS (mobile) |

---

## 🌐 SECTION 1 — PUBLIC WEBSITE (Marketing + Ordering)

### 1.1 Global Navigation Header
- Sticky top navigation bar
- Logo (left)
- Nav links: Menu, Locations, Catering, About, Blog
- Search icon (opens full-screen food search overlay)
- Cart icon with animated item count badge
- Login / Sign Up CTA button
- Language toggle: English / Yoruba / Igbo / Hausa *(optional stretch)*
- Mobile: Hamburger drawer with all nav items + auth + cart

### 1.2 Hero Section
- Full-bleed cinematic banner (video or high-quality image carousel)
- Bold headline: e.g. *"Real Nigerian Flavour. Delivered Fast."*
- Subheadline: short value proposition
- Primary CTA: "Order Now" → jumps to menu
- Secondary CTA: "View Locations"
- Floating order type selector: **Delivery | Pickup | Dine-In** toggle
- Location input (auto-detect with geolocation fallback)
- Estimated delivery time display (e.g. "Delivering in ~35 mins to your area")

### 1.3 Menu / Food Catalog Page
- Sticky horizontal category filter tabs: All, Rice Dishes, Soups, Grills & Suya, Snacks, Drinks, Combos, Family Packs, Specials
- Grid/list toggle view
- Search bar with real-time filter
- Sort: Popular | Price (Low-High) | Newest | Fastest Prep
- Dietary filter chips: Halal, Spicy, Vegetarian, Gluten-Free
- **Food Cards** — each card must include:
  - High-quality food image
  - Name, short description
  - Price in Naira (₦)
  - Rating (stars + review count)
  - Spice level indicator (🌶 icons)
  - Badges: Bestseller, New, Chef's Pick, Limited
  - Add to Cart button (+ quick quantity selector)
  - Wishlist/favorite toggle
  - "Customize" button (triggers modifier modal)
- Pagination or infinite scroll
- Empty state: "No items found in your area — try adjusting your location"

### 1.4 Food Detail Page / Modal
- Large food image gallery (thumbnail switcher)
- Full name, description, ingredients, allergens
- Price breakdown
- Portion size selector (Single, Sharing, Family)
- Customization/modifiers (e.g. protein choice: chicken, beef, goat; spice level; extra toppings with prices)
- Quantity selector
- Add to Cart CTA (prominent, sticky on mobile)
- Nutrition info (calories, macros — optional)
- Customer reviews section (star rating + text reviews + photos)
- Related / "Pairs well with" items carousel
- Social share buttons

### 1.5 Cart & Checkout Flow

**Cart Drawer (slide-in) + Full Cart Page:**
- Line items with image, name, customizations, unit price × quantity
- Quantity +/− controls + remove item
- Special instructions field per item
- Promo code / coupon input (validate via API)
- Order type reminder (Delivery / Pickup / Dine-In)
- Subtotal, delivery fee (calculated by distance), service charge, VAT (7.5%)
- Estimated total in ₦
- Minimum order warning if applicable
- Upsell section: "Complete your order with…"
- Proceed to Checkout CTA

**Checkout Page (multi-step):**

Step 1 — Contact & Delivery Info:
- Full name, phone number, email
- Delivery address (Google Maps autocomplete)
- Delivery map pin drop confirmation
- Saved addresses (for logged-in users)
- Delivery notes (gate code, landmark, etc.)

Step 2 — Scheduling:
- ASAP delivery toggle
- Schedule for later (date + time picker)
- Preferred delivery window

Step 3 — Payment:
- Paystack inline (card, bank transfer, USSD, POS)
- Flutterwave option
- Cash on Delivery (with note: "Exact change appreciated")
- Wallet balance (if applicable)
- Saved cards (for logged-in users)
- Apple Pay / Google Pay (if supported)
- Order summary sidebar (always visible on desktop)
- Place Order button → loading state → confirmation

**Order Confirmation Page:**
- Order number + timestamp
- Animated success state (✅ lottie or CSS animation)
- Summary of ordered items
- Estimated delivery time + live tracking CTA
- Download receipt / email receipt
- "Track My Order" button
- "Order Again" shortcut

### 1.6 Live Order Tracking Page
- Real-time map showing rider location (Google Maps or Mapbox)
- Order status timeline: Confirmed → Preparing → Ready → Picked Up → On the Way → Delivered
- Rider profile card: name, photo, rating, phone number (tap to call)
- Estimated arrival countdown timer
- Chat with rider (basic messaging)
- "Report Issue" button
- Delivery receipt signature (optional for premium)

### 1.7 Loyalty & Rewards Section (Public-facing)
- "ChopPoints" program overview page
- How it works: earn points per ₦ spent, redeem for discounts
- Current tier levels: Bronze → Silver → Gold → Diamond
- Benefits per tier
- CTA: Join Now / Check Your Points

### 1.8 Catering / Bulk Orders Page
- Hero with catering imagery
- Event types: Corporate, Wedding, Birthday, Church/Mosque events
- Minimum order quantity
- Custom menu builder form
- Price estimator
- Request a Quote form (name, event type, guests, date, location, notes)
- Past catering events gallery
- Testimonials from corporate clients

### 1.9 Restaurant Locations Page
- Map view of all outlets
- List view with location cards
- Per-location: address, opening hours, phone, directions link, dine-in availability, order CTA
- Nearest location auto-detection

### 1.10 About / Brand Story Page
- Founders' story
- Mission and values
- Timeline of milestones
- Team section
- Press mentions / media logos
- Sustainability commitment

### 1.11 Blog / Content Page
- Food culture articles (Nigerian recipes, food history, nutrition)
- Card grid + featured post hero
- Category filters: Food Culture, Health, Behind the Kitchen, News
- Individual post page with rich text, images, author info, related posts
- Share buttons, comment section

### 1.12 Footer
- Logo + tagline
- Links: Menu, Locations, Catering, Careers, Press, Affiliate Program
- Social media icons: Instagram, TikTok, Twitter/X, Facebook, YouTube
- App store download badges (iOS App Store + Google Play)
- Newsletter subscription input
- Contact info: email, phone, address
- Legal: Privacy Policy, Terms of Service, Refund Policy, Cookie Policy
- Copyright line
- Payment method icons: Paystack, Flutterwave, Visa, Mastercard, Verve

### 1.13 Additional Website Pages
- **FAQs** — accordion format, searchable
- **Contact Us** — form + map embed + live chat widget trigger
- **Careers / Jobs** — open roles list with apply flow
- **Affiliate / Referral Program** — how to earn, referral link generator
- **Privacy Policy, Terms of Service, Cookie Policy** — legal text pages
- **404 Page** — branded, with suggested actions
- **Maintenance Mode Page**

---

## 👤 SECTION 2 — CUSTOMER DASHBOARD (Web + Mobile)

### 2.1 Auth Flow
- Sign Up: name, email, phone, password (+ OTP verification via SMS/email)
- Login: email/phone + password
- Forgot Password: OTP → reset
- OAuth: Google, Apple (mobile)
- Biometric login (mobile): Face ID / Fingerprint

### 2.2 Customer Home (Dashboard)
- Personalized greeting: "Welcome back, Emeka 👋"
- Active order status card (if any) — tap to track
- Quick reorder: last 3 orders
- Recommended for you (AI-personalized, based on order history)
- Today's specials carousel
- ChopPoints balance widget
- Recent activity feed

### 2.3 Order Management
- Active Orders tab: live status with real-time updates
- Past Orders tab: full order history, sortable/searchable
- Per-order view: items, total, status, receipt, reorder CTA
- Order issue reporting: wrong item, missing item, quality complaint
- Cancel order (within grace period window)
- Rate order: star rating + text review + photo upload

### 2.4 Profile & Settings
- Profile photo upload + edit
- Name, email, phone (with verification for changes)
- Date of birth (for birthday rewards)
- Dietary preferences (Halal, Vegetarian, Allergies)
- Notification preferences (push, SMS, email — per type)
- Language preference
- Password change
- Two-factor authentication toggle
- Delete account

### 2.5 Address Book
- Saved delivery addresses list
- Add / Edit / Delete address
- Default address setting
- Address labels: Home, Work, Other
- Map-based address pin drop

### 2.6 Payment Methods
- Saved card list (masked PAN, expiry, card type icon)
- Add new card (via Paystack)
- Delete card
- Wallet: ChopWallet balance, top-up, transaction history
- Promo codes / vouchers: view active, redeem

### 2.7 Loyalty & Rewards
- ChopPoints balance (animated counter)
- Current tier + progress bar to next tier
- Points history (earned per order, redeemed)
- Available rewards catalog (redeem points for discounts or free items)
- Referral program: unique referral link/code, share button, track earnings

### 2.8 Favourites / Wishlist
- Saved food items grid
- Quick add to cart from wishlist
- Remove from favourites

### 2.9 Notifications Center
- All notifications with read/unread state
- Types: Order updates, promotions, loyalty milestone, system alerts
- Mark all as read
- Deep links from notification to relevant page

### 2.10 Help & Support
- FAQ (searchable, categorized)
- Live chat widget (with AI chatbot + human escalation)
- Submit a ticket (form with order reference, issue type, description, photo upload)
- My tickets: view past support tickets + status
- Call support button (click-to-call)

---

## 🛵 SECTION 3 — RIDER / DELIVERY AGENT APP

*(Mobile App — React Native or Flutter)*

### 3.1 Rider Auth
- Phone number + OTP login
- Profile: name, photo, vehicle type (bike/car), license plate, bank details (for payouts)
- Document upload: license, ID, insurance

### 3.2 Rider Home Screen
- Online / Offline toggle (large, prominent)
- Earnings today / this week summary
- Current delivery card (if active)
- Incoming order request popup (accept / decline with 15-sec timer)
- Nearby available orders (optional pool mode)

### 3.3 Active Delivery Flow
- Order details: restaurant name + address, customer name + address, order summary
- Navigation: turn-by-turn via Google Maps or Mapbox
- Status update buttons: "Arrived at Restaurant" → "Picked Up" → "Arrived at Customer" → "Delivered"
- Contact buttons: call restaurant, call customer
- Proof of delivery: photo upload + e-signature
- Report issue: couldn't reach customer, wrong address, etc.

### 3.4 Earnings & Payouts
- Earnings breakdown: base pay + tips + bonuses
- Weekly/monthly statement
- Payout history
- Request payout → bank transfer (Paystack Transfer API)

### 3.5 Delivery History
- Past completed deliveries with earnings
- Filter by date range
- Customer ratings received

### 3.6 Rider Profile & Documents
- Edit personal info
- Update vehicle info
- Upload/re-upload required documents
- View document approval status

### 3.7 Rider Notifications & Support
- Real-time order notifications
- Performance alerts (low rating warning)
- In-app support chat

---

## 🏢 SECTION 4 — RESTAURANT ADMIN DASHBOARD

*(Full web dashboard — React/Next.js)*

### 4.1 Admin Auth & Security
- Secure login (email + password + 2FA)
- Role-based access: Owner, Manager, Kitchen Staff, Cashier
- Session management / forced logout
- Audit log (who did what, when)

### 4.2 Main Dashboard (Overview)
- KPI cards: Today's Revenue (₦), Total Orders, Avg Order Value, Active Riders
- Revenue chart: daily/weekly/monthly line or bar chart
- Orders by status donut chart
- Top selling items (ranked list)
- Recent orders feed (real-time updates)
- Customer satisfaction score (avg rating)
- Pending issues / complaints count

### 4.3 Order Management
- Live Orders board (Kanban-style): New → Confirmed → In Preparation → Ready → Dispatched → Delivered
- Order detail panel: customer info, items, special instructions, address, payment method
- Assign rider to order
- Estimated prep time setter
- Print order receipt / KDS (Kitchen Display System) view
- Cancel / refund order with reason
- Bulk order actions (confirm multiple)
- Filter: by status, date, order type, location
- Search by order ID, customer name, phone

### 4.4 Menu Management
- Full menu CRUD: add, edit, delete food items
- Rich text description editor
- Image upload (Cloudinary integration)
- Category management (add/edit/delete/reorder categories)
- Item modifiers/customizations: add option groups (e.g., protein type, spice level)
- Pricing management (set price, sale price, duration)
- Stock/availability toggle (mark item as unavailable instantly)
- Bulk availability toggle (toggle entire category on/off — e.g., for breakfast hours)
- Menu scheduling (breakfast / lunch / dinner menus by time)
- Featured items / badges management
- Preview how item appears on storefront

### 4.5 Customer Management
- Customer list with search and filter
- Per-customer profile: contact info, order history, ChopPoints balance, complaints
- Manual loyalty points adjustment (with reason)
- Customer messaging (push notification or SMS to single customer)
- Block / unblock customer

### 4.6 Rider / Delivery Management
- Active riders map view (real-time GPS dots)
- Rider list: online status, current assignment, rating
- Assign / reassign riders to orders manually
- Rider performance report: deliveries completed, avg rating, on-time rate
- Approve new rider applications
- Suspend / deactivate rider
- Rider earnings and payout management

### 4.7 Promotions & Marketing
- Coupon/promo code generator: % discount, fixed ₦ discount, BOGO, free delivery
- Set validity dates, minimum order, max usage, per-user limit
- Active promotions list with usage analytics
- Push notification campaigns (target: all users, segment by location/tier/behaviour)
- SMS campaign builder (via Termii)
- Flash sale creator with countdown timer
- Banner/homepage hero content manager (CMS-lite)
- Loyalty program settings: points per ₦ spent, tier thresholds, rewards catalog editor

### 4.8 Payments & Financials
- Revenue dashboard (today, MTD, YTD) with charts
- Transaction log: all successful payments with filter
- Refunds management: initiate refund, track status
- Commission/fee breakdown (Paystack fees, service charges)
- Wallet payouts to riders (initiate batch payouts)
- Failed transactions log with retry option
- Daily/weekly/monthly revenue report (exportable as PDF or Excel)
- VAT/Tax report

### 4.9 Reviews & Ratings Management
- All customer reviews feed (food + delivery)
- Reply to reviews
- Flag/remove abusive reviews
- Rating analytics by item and by delivery
- Net Promoter Score (NPS) tracker

### 4.10 Inventory & Stock Management *(optional but recommended)*
- Ingredient/stock list with quantities
- Low stock alerts
- Restock request logging
- Link ingredients to menu items (auto-deplete on order)
- Supplier contact directory

### 4.11 Reports & Analytics
- Sales report (by date range, category, item)
- Customer acquisition report (new vs returning)
- Order completion vs cancellation rate
- Peak hours heatmap (orders by hour-of-day and day-of-week)
- Delivery performance (avg delivery time, on-time %)
- Geographic sales map (which areas order most)
- Export all reports: CSV, PDF
- Scheduled automated email reports (daily summary, weekly digest)

### 4.12 Settings (Restaurant)
- Business profile: name, logo, description, contact info
- Operating hours per day (open/close time, or closed)
- Holiday/special hours scheduler
- Delivery radius setting on map
- Minimum order value
- Delivery fee structure (flat fee, distance-based, free above threshold)
- Service charge toggle and rate
- Tax (VAT) setting
- Notification preferences (new order sound, SMS/email alerts)
- Integration settings: Paystack API keys, Google Maps key, SMS provider
- Branch/outlet management (for multi-location)
- Staff accounts management (invite, role assign, deactivate)

---

## 🔑 SECTION 5 — SUPER ADMIN PANEL

*(Platform-level control — for platform owner / tech team)*

### 5.1 Platform Overview Dashboard
- Total restaurants on platform (if multi-vendor)
- Total registered customers
- Total active riders
- Total orders today / this month
- Platform-wide revenue and commission earnings
- System health indicators (API uptime, error rate)

### 5.2 Restaurant Management *(for multi-vendor mode)*
- Onboard new restaurant: business info, menu import, contract terms
- Approve/reject restaurant applications
- Suspend or deactivate restaurant
- View restaurant-level analytics
- Override restaurant settings

### 5.3 User Management
- All customers, riders, restaurant admins in one searchable table
- View any user profile, order history, complaints
- Manual account actions: verify, suspend, delete, adjust wallet

### 5.4 Platform Configuration
- Feature flags (enable/disable features platform-wide)
- Commission rate settings per restaurant
- Payment gateway credentials (master keys)
- Global delivery zones configuration
- Platform-wide notification broadcasting
- Terms of service / privacy policy content editor

### 5.5 System & Developer Tools
- API logs viewer (request/response, errors)
- Webhook event log
- Background job queue monitor
- Database health metrics
- Feature toggle management
- App version management (force update, minimum version)

---

## 📱 SECTION 6 — MOBILE APP (Customer-Facing)

*(React Native Expo or Flutter — iOS & Android)*

All web customer features apply plus mobile-native features:

### Mobile-Specific UX
- Onboarding screens (3–4 illustrated slides → Sign Up / Log In)
- Bottom tab navigator: Home | Menu | Orders | Rewards | Profile
- Native OS push notifications (FCN) with deep linking
- Haptic feedback on key interactions (add to cart, order placed)
- Biometric auth (Face ID / Fingerprint)
- Background order tracking notification with live ETA
- Share food items via native share sheet
- Dark mode support

### Mobile Home Tab
- Personalized feed
- Story-style promotions carousel (auto-scroll)
- Category shortcut icons (tap to jump to filtered menu)
- "Order again" quick access
- Flash deals with countdown

### Mobile Menu Tab
- Same as web catalog with mobile-optimized grid
- Swipeable food cards
- Sticky category filter tabs

### Mobile Orders Tab
- Active order with live map tracking embedded
- Past orders list

### Mobile Rewards Tab
- ChopPoints balance + animation
- Tier progress
- Referral code sharing
- Available rewards

### Mobile Profile Tab
- All profile/settings actions
- Help & support
- App version display

---

## 🎨 SECTION 7 — UI/UX DESIGN SPECIFICATIONS

### Design Principles
- **Mobile-First** — design every screen for 375px first, scale up
- **Speed-First UX** — every action from home to placed order in < 3 taps
- **Cultural resonance** — imagery, copy, and colours must feel unmistakably Nigerian
- **Accessibility** — WCAG 2.1 AA: sufficient contrast, tap target size ≥ 44px, screen reader labels
- **Skeleton loaders** on every data-fetch surface (not spinners)
- **Optimistic UI** — cart updates feel instant; reconcile with server silently

### Colour Palette
```
Primary:     #C8410B  (Deep Terracotta / Pepper Red)
Secondary:   #F5A623  (Saffron Yellow / Market Gold)
Accent:      #2D6A4F  (Forest Green / Plantain Leaf)
Dark:        #1C1C1E  (Rich Charcoal)
Light BG:    #FFF8F0  (Warm Cream)
Surface:     #FFFFFF
Error:       #D62828
Success:     #40916C
Warning:     #F3722C
Text-Primary:#1C1C1E
Text-Muted:  #6B7280
Border:      #E5E0D8
```

### Typography
```
Display/Headings:  Clash Display or Cabinet Grotesk (Bold, ExtraBold)
Body/UI:           Satoshi or DM Sans (Regular, Medium, SemiBold)
Monospace/prices:  JetBrains Mono or IBM Plex Mono
```

### Spacing System (8pt Grid)
```
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px
```

### Border Radius
```
sm: 8px | md: 12px | lg: 16px | xl: 24px | full: 9999px
```

### Iconography
- Use **Phosphor Icons** or **Lucide** — consistent, clean, not overly decorative

### Micro-interactions & Animation
- Page transitions: fade + slight upward translate
- Cart badge: bouncy scale animation on item add
- Button press: subtle scale-down (0.97) + haptic (mobile)
- Success states: confetti or lottie animation
- Notification toast: slide-in from top, auto-dismiss after 3s
- Map tracking: smooth rider pin movement

### Component Library (Build These Reusable Components)
- `<FoodCard />` — standard + compact variants
- `<CategoryTab />` — horizontal scroll pill tabs
- `<CartDrawer />` — slide-in panel
- `<OrderStatusBadge />` — colour-coded status pill
- `<StarRating />` — interactive + display mode
- `<PriceDisplay />` — ₦ currency formatting
- `<AddressAutocomplete />` — Google Places-powered
- `<OTPInput />` — 6-box OTP entry
- `<SkeletonLoader />` — context-aware shapes
- `<ToastNotification />` — success/error/info variants
- `<BottomSheet />` — mobile modal/drawer pattern
- `<MapPin />` — custom branded map marker

---

## 🔧 SECTION 8 — BACKEND API ARCHITECTURE

### Core API Modules (RESTful + WebSocket)

```
Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/logout
  POST   /auth/refresh-token
  POST   /auth/verify-otp
  POST   /auth/forgot-password
  POST   /auth/reset-password

Menu:
  GET    /menu/categories
  GET    /menu/items
  GET    /menu/items/:id
  POST   /menu/items          (admin)
  PUT    /menu/items/:id      (admin)
  DELETE /menu/items/:id      (admin)
  PATCH  /menu/items/:id/availability (admin)

Orders:
  POST   /orders              (create order)
  GET    /orders              (customer: my orders | admin: all orders)
  GET    /orders/:id
  PATCH  /orders/:id/status   (admin/rider)
  POST   /orders/:id/cancel
  POST   /orders/:id/rate

Cart:
  GET    /cart
  POST   /cart/items
  PUT    /cart/items/:id
  DELETE /cart/items/:id
  DELETE /cart              (clear cart)

Payments:
  POST   /payments/initiate
  POST   /payments/verify
  POST   /payments/refund    (admin)

Customers:
  GET    /customers/:id
  PUT    /customers/:id
  GET    /customers/:id/addresses
  POST   /customers/:id/addresses
  DELETE /customers/:id/addresses/:addressId

Riders:
  GET    /riders
  GET    /riders/:id
  PATCH  /riders/:id/status  (online/offline)
  PATCH  /riders/:id/location (GPS update)

Promotions:
  GET    /promotions
  POST   /promotions         (admin)
  POST   /promotions/validate (check coupon code)

Loyalty:
  GET    /loyalty/balance
  GET    /loyalty/history
  POST   /loyalty/redeem

Notifications:
  POST   /notifications/send (admin)
  GET    /notifications      (customer: inbox)

Admin:
  GET    /admin/dashboard/stats
  GET    /admin/reports/sales
  GET    /admin/reports/customers
  ... (all admin-scoped endpoints)

WebSocket Events:
  order:new         → kitchen + admin real-time alert
  order:status_update → customer real-time tracking
  rider:location    → customer map tracking
  chat:message      → customer-rider messaging
```

### Database Schema (Key Tables)
```sql
users, user_addresses, user_sessions
restaurants, restaurant_hours, restaurant_locations
menu_categories, menu_items, item_modifiers, modifier_options
orders, order_items, order_status_history
payments, refunds
riders, rider_locations, rider_earnings
promotions, coupon_codes, promotion_usage
loyalty_points, loyalty_transactions, loyalty_tiers
reviews, review_replies
notifications, push_subscriptions
support_tickets, ticket_messages
audit_logs
```

---

## 🌍 SECTION 9 — NIGERIA-SPECIFIC REQUIREMENTS

### Currency & Pricing
- All prices displayed in **Nigerian Naira (₦)**
- Format: ₦1,500 (comma separator, no decimal for whole naira)
- Price range: typical Nigerian fast food pricing ₦800 – ₦8,000 per item

### Payment Integration
- **Paystack** — primary gateway (card, bank transfer, USSD *737#, POS, QR)
- **Flutterwave** — fallback / alternative
- **Cash on Delivery** — with "exact change appreciated" notice
- **Wallet top-up** via bank transfer with auto-confirmation
- Naira-only transactions (no foreign currency)

### Phone Number Format
- Nigerian format: +234 8XX XXX XXXX or 080X XXX XXXX
- OTP via SMS (Termii or Twilio Nigeria)
- WhatsApp OTP option (popular in Nigeria)

### Address & Delivery
- No formal street addresses in many areas — support landmark-based addressing
- e.g., "Behind UBA Bank, Wuse 2, Abuja"
- Google Maps autocomplete tuned to Nigeria
- Delivery zones: Major Nigerian cities initially — Lagos, Abuja, Port Harcourt, Kano, Ibadan
- Traffic-aware ETA (Lagos traffic is severe — account for it)

### Language & Copy
- English (Nigerian English tone — warm, direct, a little playful)
- Common Nigerian expressions in microcopy: "Your chop is on the way!", "Add to cart — no dulling!", "E don ready!"
- Food names in native languages with English subtitle

### Food Categories (Sample Data)
```
Rice Dishes:     Jollof Rice, Fried Rice, White Rice + Stew, Concoction Rice (Iwuk)
Soups:           Egusi, Banga, Oha, Pepper Soup, Okra Soup, Afang, Groundnut Soup
Swallow:         Pounded Yam, Eba (Garri), Amala, Semo, Fufu, Tuwo Shinkafa
Grills:          Suya (beef/chicken/liver), Asun, Peppered Chicken, Kilishi
Starters/Snacks: Puff Puff, Akara, Moin Moin, Samosa, Spring Rolls, Chin Chin
Proteins:        Nkwobi, Isi Ewu, Peppered Goat, Catfish
Street Food:     Rolex (chapati + egg), Bole (roasted plantain + fish)
Drinks:          Zobo, Kunu, Chapman, Palm Wine, Soda, Water, Juice
Desserts:        Chin Chin, Coconut Candy, Groundnut Candy
Family Packs:    Family Rice Combo, Party Pack (feeds 10), Chop Chop Deal
```

---

## 📋 SECTION 10 — FULL FEATURE CHECKLIST

### Website
- [ ] Responsive public website (all pages listed)
- [ ] Dynamic menu with categories, search, filters
- [ ] Food detail page with gallery + customizations
- [ ] Cart (drawer + page) with real-time updates
- [ ] Multi-step checkout (contact → schedule → payment)
- [ ] Paystack + Flutterwave + Cash on Delivery
- [ ] Order confirmation + receipt
- [ ] Live order tracking with map
- [ ] Customer auth (register, login, OTP, OAuth)
- [ ] Customer dashboard (full, all tabs)
- [ ] Loyalty program (ChopPoints)
- [ ] Referral program
- [ ] Blog / content pages
- [ ] Catering inquiry page
- [ ] Restaurant locations page
- [ ] SEO metadata (title, description, OG tags per page)
- [ ] Cookie consent banner (NDPR compliance)
- [ ] PWA manifest (installable as app from browser)

### Mobile App
- [ ] Onboarding flow
- [ ] Auth (register, login, biometric, OTP)
- [ ] Home feed with personalization
- [ ] Full menu catalog with filters
- [ ] Food detail + customization + add to cart
- [ ] Cart + checkout (full flow)
- [ ] Live tracking with embedded map
- [ ] Rider chat
- [ ] Order history + reorder
- [ ] Rewards + loyalty
- [ ] Profile + settings
- [ ] Push notifications with deep linking
- [ ] Dark mode

### Admin Dashboard
- [ ] Overview KPI dashboard with charts
- [ ] Real-time live orders board (Kanban)
- [ ] Order detail + assign rider + update status
- [ ] Full menu CRUD with image upload
- [ ] Customer management
- [ ] Rider management + live map
- [ ] Promo/coupon engine
- [ ] Push notification / SMS campaign tool
- [ ] Payment + refunds management
- [ ] Reviews management
- [ ] Reports + analytics with export
- [ ] Multi-branch management
- [ ] Staff roles + permissions
- [ ] Settings (all)

### Rider App
- [ ] Rider auth + profile
- [ ] Online/offline toggle
- [ ] Incoming order requests with accept/decline
- [ ] Turn-by-turn navigation to restaurant + customer
- [ ] Status update buttons
- [ ] Proof of delivery (photo)
- [ ] Earnings dashboard
- [ ] Payout request
- [ ] Delivery history
- [ ] In-app support

### Backend / API
- [ ] All REST API endpoints documented
- [ ] WebSocket real-time events
- [ ] JWT auth + refresh tokens
- [ ] Role-based access control (RBAC)
- [ ] Paystack webhook handler (payment verification)
- [ ] FCM push notifications
- [ ] SMS OTP via Termii
- [ ] Google Maps / Geocoding integration
- [ ] Cloudinary image upload
- [ ] Redis caching (menu, sessions)
- [ ] Rate limiting + API security
- [ ] Error handling + logging (Winston/Sentry)
- [ ] Background jobs (order timeout, daily reports)

---

## 🚀 DELIVERY EXPECTATIONS FOR AI BUILDERS

### For UI/UX Tools (Stitch, Galileo, Uizard, Framer AI):
Generate complete high-fidelity design screens for:
1. All public website pages (desktop + mobile)
2. Customer mobile app (all screens)
3. Customer web dashboard
4. Restaurant admin dashboard
5. Rider mobile app
6. Super admin panel

Use the colour palette, typography, and component specs from Section 7 exactly. Every screen must have real Nigerian food imagery placeholders, Naira pricing, and Nigerian contextual copy.

### For Code Builders (Cursor, Windsurf, Bolt, v0, Lovable, Replit Agent):
Scaffold the complete monorepo:
```
/chopfast
  /apps
    /web          → Next.js 14 (public website + customer dashboard)
    /admin        → Next.js 14 (restaurant admin + super admin)
    /mobile       → React Native Expo (customer app)
    /rider        → React Native Expo (rider app)
  /packages
    /api          → Node.js + NestJS (all backend)
    /shared       → shared types, utils, constants
    /ui           → shared component library
  /infra
    /db           → PostgreSQL schema + migrations
    /redis        → cache config
```

Implement all features from the Feature Checklist (Section 10) in order of priority:
1. Auth + Menu + Cart + Checkout + Payments (Core)
2. Order tracking + Rider app (Fulfillment)
3. Admin dashboard (Operations)
4. Loyalty + Promotions (Growth)
5. Analytics + Reports (Intelligence)
6. Mobile app (Distribution)

---

*This prompt is the single source of truth for the entire platform build. Every screen, every API endpoint, every feature must trace back to a requirement defined here. Build it as if it will go live tomorrow in Lagos.*
