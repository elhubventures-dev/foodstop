# Reference 03 — Customer App (ng.chopfast.customer)

## Navigation Structure
```
Bottom Nav:
  Tab 1 → Home        (Feed, Stories, Quick actions)
  Tab 2 → Discover    (Restaurant search & browse)
  Tab 3 → Orders      (Active tracking + history)
  Tab 4 → Rewards     (ChopPoints, tier, gamification)
  Tab 5 → Profile     (Account, wallet, settings)

Additional routes (modal/push):
  /restaurant/:slug        → Merchant storefront
  /restaurant/:slug/menu   → Full menu
  /cart                    → Cart page
  /checkout                → Checkout flow
  /order/:id/track         → Live tracking map
  /group-order/:code       → Group order session
  /search                  → Global search
  /notifications           → Notification center
```

---

## Onboarding Flow

3 illustrated screens → Sign Up or Log In

Screen 1: "Order Nigerian Food You Love"
  - Illustration: jollof rice steaming from bowl
  - "From suya to pepper soup — discover the best restaurants near you"

Screen 2: "Track Every Delivery Live"
  - Illustration: map with rider pin moving
  - "Watch your food travel from kitchen to your door in real time"

Screen 3: "Earn ChopPoints on Every Order"
  - Illustration: Gold coin stack + tier badge
  - "Collect points, unlock tiers, and get exclusive rewards"

[Get Started Button → Sign Up] [Already have account → Log In]

---

## Auth Feature

### Sign Up Flow
1. Phone number entry (Nigerian format enforced, +234 or 080X auto-format)
2. OTP verification (6-digit, Termii SMS, 60s resend timer)
3. Name + email + password
4. Location permission request ("So we can show restaurants near you")
5. Success → Home

### Log In
- Phone/email + password
- Biometric login (Face ID / Fingerprint via local_auth)
- Remember device toggle
- Forgot password: OTP reset flow

### OAuth
- Google Sign In (google_sign_in)
- Apple Sign In (sign_in_with_apple) — iOS only

---

## Home Tab

### Stories Row (Feature #8 — In-App Stories/Reels)
```dart
// Horizontal scroll of merchant story bubbles at top of home
// Stories: 15-60 second food videos uploaded by merchants
// Tapping opens full-screen story viewer (like Instagram)
// Auto-advance after each story
// Progress bar at top
// Swipe left/right to navigate between merchants
// "Order Now" button overlaid at bottom of story → opens merchant storefront

class StoryRing extends StatelessWidget {
  final Merchant merchant;
  final bool hasUnwatched;  // Colored border if unwatched, grey if seen

  @override
  Widget build(BuildContext context) => Column(children: [
    Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: hasUnwatched ? LinearGradient(colors: [
          ChopFastColors.primary, ChopFastColors.secondary,
        ]) : null,
        color: hasUnwatched ? null : ChopFastColors.borderLight,
      ),
      child: CircleAvatar(
        radius: 30,
        backgroundImage: NetworkImage(merchant.logoUrl),
      ),
    ),
    Text(merchant.businessName, maxLines: 1, style: captionStyle),
  ]);
}
```

### Home Feed Sections
1. **Location bar** — "Delivering to: 14 Akin Adesola, VI" [Edit] — tap to change
2. **Stories row** — merchant story bubbles (horizontal scroll)
3. **Active order card** — if user has active order: status + countdown + [Track]
4. **"Order Again" strip** — last 3 orders with one-tap reorder button (Feature #4)
5. **Flash Sale banner** — if platform flash sale is active: countdown timer
6. **"Featured Today" section** — 3 promoted merchants (horizontal scroll)
7. **"Explore Cuisines" icon grid** — category shortcut icons
8. **"New on ChopFast" section** — recently joined restaurants
9. **"Top Rated Near You" section** — 4.7+ rating merchants
10. **"Fastest Delivery" section** — ETA < 25 minutes

### One-Tap Reorder (Feature #4)
```dart
class ReorderCard extends StatelessWidget {
  final Order previousOrder;

  @override
  Widget build(BuildContext context) => Container(
    child: Row(children: [
      // Small merchant logo
      // "Jollof Rice + 2 items from Mama Titi Kitchen"
      // "₦4,200"
      ChopFastButton(
        label: 'Reorder',
        variant: ButtonVariant.primary,
        onPressed: () async {
          await ref.read(cartNotifierProvider.notifier)
            .reorderFromPast(previousOrder);
          const CartRoute().go(context);
        },
      ),
    ]),
  );
}
```

---

## Discover Tab (Restaurant Discovery)

- Search bar at top (opens full-screen search on tap)
- Filter chips row: Open Now | Free Delivery | Top Rated | Near Me
- Sort: Relevance | Rating | Delivery Time | Min Order
- Restaurant grid (2 columns on phone, 3 on tablet)
- "Featured" restaurants at top with gold border
- Infinite scroll with shimmer loading
- Empty state if no restaurants in area: "We're not in your area yet — but we're coming soon!"
- Pull-to-refresh

---

## Restaurant Storefront Screen

- Hero banner (full width, 200px height)
- Merchant logo, name, rating, review count, distance, ETA, open status
- Info chips: cuisine type, price range, min order, delivery fee
- Sticky menu category tab bar (horizontal scroll)
- Menu items per category
- Active promotions banner (if any)
- Reviews section at bottom (last 3 + "See All" link)
- Floating "View Cart" button (appears when cart has items)

---

## Cart & Checkout

### Cart Screen
- Items list: image, name, customizations, unit price × qty, ±qty buttons, remove
- Merchant name header (single merchant rule enforced)
- Special instructions per item
- Promo code field
- Order summary: subtotal, delivery fee, VAT (7.5%), total in ₦
- "Frequently added together" upsell row
- Checkout CTA button (sticky at bottom)

### Checkout Flow (3 steps, single scroll page on mobile)

Step 1 — Delivery Details
- Saved addresses list or [Add New Address]
- Google Maps Places autocomplete (Nigeria-filtered)
- Map with draggable pin to confirm exact drop point
- Landmark/note field ("Behind GTBank, red gate")
- Contact phone (pre-filled from profile)

Step 2 — Schedule
- ASAP toggle (default ON, shows "~35 mins")
- Schedule for later: date + time picker
- Order type: Delivery / Pickup / Dine-In toggle

Step 3 — Payment
- Paystack inline (flutter_paystack)
- Card / Bank Transfer / USSD / Wallet
- Saved cards
- Cash on Delivery toggle
- Order summary (collapsible sidebar on tablet, bottom sheet on phone)
- Place Order → loading state → confirmation

### Order Confirmation
- Animated ✅ Lottie animation
- "Your order is confirmed!"
- Order reference number
- Estimated delivery time
- [Track My Order] CTA
- [Share on WhatsApp] (Nigerian favourite)

---

## Live Order Tracking Screen (Feature — Real-Time)

```dart
class TrackingScreen extends ConsumerStatefulWidget {
  // Google Map full screen
  // Custom rider marker (motorcycle icon, animated movement)
  // Custom merchant marker (restaurant pin)
  // Custom customer marker (home pin)
  // Route polyline between markers
  // Status timeline sheet (draggable bottom sheet)
  // Rider card: photo, name, rating, [Call] [Chat] buttons
  // ETA countdown timer
  // "Report Issue" button (bottom of sheet)

  @override
  ConsumerState createState() => _TrackingScreenState();
}

// Real-time rider location via Socket.io
class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  @override
  void initState() {
    super.initState();
    // Subscribe to rider:location events
    ref.read(realtimeProvider).subscribe(
      'rider:location:${widget.orderId}',
      (data) {
        final newLatLng = LatLng(data['lat'], data['lng']);
        _animateMarkerTo(_riderMarker, newLatLng); // Smooth movement
      },
    );
  }

  void _animateMarkerTo(Marker marker, LatLng target) {
    // Interpolate position over 800ms for smooth map movement
  }
}
```

---

## Feature #5 — Real-Time Chat with Restaurant

```dart
// Accessible from order tracking screen → chat button
// Simple message list (bubble UI)
// Input field + send button
// Auto-scroll to latest message
// "Read" receipts
// Pre-defined quick replies: ["Add extra pepper", "No onions please",
//                             "I'm at the gate", "How long more?"]
// Messages persist for duration of active order only
```

---

## Feature #6 — Group Ordering

```dart
// HOW IT WORKS:
// 1. User creates group order → gets shareable link/code
// 2. Friends open link → join session (need ChopFast account)
// 3. Each person browses same merchant, adds own items to shared cart
// 4. Creator sees everyone's selections in real time
// 5. Creator reviews total, applies promo, checks out for everyone
// 6. One payment, one delivery, one address

class GroupOrderScreen extends ConsumerWidget {
  // Shows: participants list (avatars + names + their items)
  // Live updates via Socket.io as others add items
  // Creator sees: "Waiting for Tunde... (viewed 2 min ago)"
  // Non-creator sees: "Emeka is the organiser — they'll checkout for the group"
  // Countdown: "Order closes in 8:32" (creator sets timer)
  // Total: "Combined cart: ₦18,400 for 4 people"
}
```

---

## Feature #7 — Scheduled Recurring Orders

```dart
// In Profile → My Recurring Orders
// Set up: "Order [saved cart] from [restaurant] every [day/week] at [time]"
// Toggle active/paused
// Edit schedule, edit cart items
// Notification 30 mins before: "Your scheduled order from Mama Titi Kitchen
//   is about to be placed. Confirm or edit."
// One-tap confirm → payment auto-charged to saved card
// Skip this week option
```

---

## Feature #9 — Gamification

```dart
// SCRATCH CARD — shown on order delivered screen
class ScratchCardWidget extends StatefulWidget {
  // Full-screen overlay after delivery rating submitted
  // Silver scratching area over mystery reward
  // Scratch with finger → reveal reward
  // Rewards: ChopPoints (100-2000), discount codes, free delivery voucher
  // "Better luck next time" if no reward (60% of orders)
  // Rewarded outcome: confetti animation + toast

// SPIN-TO-WIN — weekly for active users
class SpinWheelScreen extends StatefulWidget {
  // 8-segment spinning wheel with prizes
  // One spin per week (resets Monday)
  // Prizes: 200/500/1000 ChopPoints, ₦500 off, free delivery

// DAILY CHECK-IN STREAK
class CheckInStreakWidget extends StatelessWidget {
  // 7-day streak calendar on home screen or loyalty tab
  // Day 1: 50 points, Day 3: 150 points, Day 7: 500 points bonus
  // Broken streak: restart from Day 1
  // Streak fire emoji animation on check-in ✓

// MILESTONE BADGES (shown on profile)
// "First Order 🎉", "5 Orders 🔥", "100 Orders 🏆",
// "Night Owl 🦉" (ordered past midnight),
// "Weekend Warrior 🏖️" (5 weekend orders)
```

---

## Feature #10 — Split Payment

```dart
// At checkout: "Split with friends" option
// Host enters number of people splitting (2-6)
// Each split person gets payment link (via SMS/WhatsApp)
// Countdown: link expires in 10 minutes
// Host's share charged first; order placed when all have paid OR timer expires
// If timer expires: host asked to cover remaining balance or cancel
// Built on Paystack's Multi-Split feature

class SplitPaymentSheet extends StatefulWidget {
  // "You're splitting ₦12,400 between 3 people"
  // Custom split: [Emeka ₦5,000] [Tunde ₦4,000] [Ngozi ₦3,400]
  // Equal split toggle (auto-divides by N)
  // Share payment link button → opens system share sheet
  // Live status: "Waiting for Tunde (₦4,000)... [Remind]"
  //              "✓ Ngozi paid ₦3,400"
}
```

---

## Feature #3 — AR Food Preview (V2 Roadmap)

```
Implementation path (V2 — not V1):
- Use ARCore (Android) + ARKit (iOS) via arkit_plugin / arcore_flutter_plugin
- 3D food models created from merchant food photos using photogrammetry
- Customer taps "AR Preview" on food item → points camera at table
- Scaled 3D model of food appears on table surface
- Rotate/zoom with pinch/rotate gestures
- "Add to Cart" button visible in AR overlay

V1 alternative: 360° photo viewer (simpler, still impressive)
Use: panorama_viewer package
Merchant uploads 360° food photo → customer can rotate to see all angles
```

---

## Dark Mode (Feature #1)

```dart
// System-level auto-detection + manual override in settings

// In ProfileScreen → Settings:
SettingsTile(
  title: 'App Appearance',
  trailing: SegmentedButton<ThemeMode>(
    segments: const [
      ButtonSegment(value: ThemeMode.light, icon: Icon(Icons.light_mode), label: Text('Light')),
      ButtonSegment(value: ThemeMode.system, icon: Icon(Icons.brightness_auto), label: Text('Auto')),
      ButtonSegment(value: ThemeMode.dark, icon: Icon(Icons.dark_mode), label: Text('Dark')),
    ],
    selected: {ref.watch(themeModeProvider)},
    onSelectionChanged: (mode) => ref.read(themeModeProvider.notifier).set(mode.first),
  ),
),

// All screens use theme tokens from ChopFastTheme — NO hardcoded colors anywhere
// Dark mode: surface = #1C1F26, bg = #13151A, cards = #1E2128
```

---

## Offline Mode (Feature #2)

```dart
// ConnectivityNotifier watches internet status
// When offline:
//   - Banner appears at top: "📡 You're offline — showing saved results"
//   - Home feed: shows last cached restaurants + menus
//   - Past orders: shows from Hive cache
//   - Cart: preserved in local storage (survives app kill)
//   - Checkout: shows "Internet required to place order" message
//   - Tracking: shows last known rider position + "Reconnecting..."

// When back online:
//   - Banner disappears with animation
//   - Silent background refresh of all stale data
//   - If order was in progress: resumes WebSocket tracking
```
