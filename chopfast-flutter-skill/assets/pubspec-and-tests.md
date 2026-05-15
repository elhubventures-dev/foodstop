# assets/pubspec-dependencies.md
# All Flutter packages used across the monorepo with pinned versions

## Shared Packages (included in most apps)

### State Management & Architecture
```yaml
dependencies:
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5
  hooks_riverpod: ^2.5.1
  flutter_hooks: ^0.20.5

dev_dependencies:
  riverpod_generator: ^2.4.0
  build_runner: ^2.4.9
  custom_lint: ^0.6.4
  riverpod_lint: ^2.3.10
```

### Navigation
```yaml
dependencies:
  go_router: ^14.0.2

dev_dependencies:
  go_router_builder: ^2.7.0
```

### Networking
```yaml
dependencies:
  dio: ^5.4.3+1
  retrofit: ^4.1.0
  pretty_dio_logger: ^1.3.1
  connectivity_plus: ^6.0.3

dev_dependencies:
  retrofit_generator: ^8.1.0
```

### Models & Serialization
```yaml
dependencies:
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0

dev_dependencies:
  freezed: ^2.5.2
  json_serializable: ^6.8.0
```

### Local Storage & Caching
```yaml
dependencies:
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.3

dev_dependencies:
  hive_generator: ^2.0.1
```

### Authentication
```yaml
dependencies:
  local_auth: ^2.2.0          # Biometric (Face ID / Fingerprint)
  google_sign_in: ^6.2.1      # Google OAuth
  sign_in_with_apple: ^6.1.0  # Apple OAuth (iOS required)
```

### Firebase
```yaml
dependencies:
  firebase_core: ^3.1.0
  firebase_auth: ^5.1.0
  firebase_messaging: ^15.0.1
  firebase_analytics: ^11.1.0
  firebase_crashlytics: ^4.0.1
  cloud_firestore: ^5.0.1       # For real-time chat (rider-customer)
```

### Maps & Location
```yaml
dependencies:
  google_maps_flutter: ^2.7.0
  geolocator: ^12.0.0
  geocoding: ^3.0.0
  flutter_polyline_points: ^2.1.0
```

### Payments
```yaml
dependencies:
  flutter_paystack: ^2.0.0
```

### Real-time
```yaml
dependencies:
  socket_io_client: ^2.0.3+1
```

### Images & Media
```yaml
dependencies:
  cached_network_image: ^3.3.1
  image_picker: ^1.1.2
  image_cropper: ^7.0.3
  photo_view: ^0.14.0
  video_player: ^2.8.6      # For merchant Stories
  chewie: ^1.8.2             # Video player UI wrapper
```

### UI & Animations
```yaml
dependencies:
  shimmer: ^3.0.0
  lottie: ^3.1.0             # For success/celebration animations
  flutter_animate: ^4.5.0    # Declarative animation DSL
  animations: ^2.0.11        # Material motion transitions
  flutter_svg: ^2.0.10+1
  phosphor_flutter: ^2.1.0   # Icon library
  dotted_border: ^2.1.0
```

### Push Notifications (local)
```yaml
dependencies:
  flutter_local_notifications: ^17.1.2
```

### Text & Input
```yaml
dependencies:
  pinput: ^5.0.0              # OTP input (6-box)
  phone_form_field: ^9.1.5   # Nigerian phone input with flag
  flutter_typeahead: ^5.2.0  # Address autocomplete
  intl: ^0.19.0              # Naira formatting, dates
```

### Misc Utilities
```yaml
dependencies:
  url_launcher: ^6.3.0
  share_plus: ^9.0.0          # Native share sheet
  flutter_tts: ^4.0.2         # Voice alerts (merchant KDS)
  mobile_scanner: ^5.1.1      # Barcode scanner (inventory)
  home_widget: ^0.6.0         # Android/iOS home screen widget
  wakelock_plus: ^1.2.6       # Keep screen on (KDS mode)
  qr_flutter: ^4.1.0          # QR code generation (affiliate links)
  path_provider: ^2.1.3
  package_info_plus: ^8.0.0
  device_info_plus: ^10.1.0
  permission_handler: ^11.3.1
  flutter_background_service: ^5.0.5  # Background location for rider
  sentry_flutter: ^8.3.0
  shorebird_code_push: ^1.3.0  # OTA updates
```

### Charts & Analytics
```yaml
dependencies:
  fl_chart: ^0.68.0           # Primary chart library
  heat_map: ^0.0.5            # Rider zone heatmap
```

### Offline / Sync
```yaml
dependencies:
  connectivity_plus: ^6.0.3
```

## App-Specific Packages

### Customer App only
```yaml
  arkit_plugin: ^1.0.6         # AR Food Preview (iOS) - V2
  ar_flutter_plugin: ^0.7.3    # AR Food Preview (Android) - V2
  confetti: ^0.7.0             # Gamification celebrations
  scratch_card: ^2.0.0         # Post-delivery scratch card
  spinning_wheel: ^1.1.0       # Spin-to-win wheel
```

### Merchant App only
```yaml
  flutter_tts: ^4.0.2          # Voice order alerts
  home_widget: ^0.6.0          # Revenue home screen widget
```

### Rider App only
```yaml
  flutter_background_service: ^5.0.5  # Background GPS tracking
  background_location: ^0.5.0
```

### Admin App only
```yaml
  syncfusion_flutter_maps: ^25.1.38   # Advanced heatmap for command center
```

---

# assets/test-cases.md
# 12 Test Prompts for AI Code Builders

## TEST 01 — Monorepo Bootstrap
Prompt: "Using the chopfast-flutter-apps skill, set up the complete Flutter
monorepo with Melos. Create melos.yaml, set up the chopfast_ui package with
theme tokens and spacing, and the chopfast_models package with the Order,
Merchant, and MenuItem Freezed models. Run code generation."

Expected output:
- melos.yaml with all scripts defined
- packages/chopfast_ui/pubspec.yaml with correct dependencies
- packages/chopfast_ui/lib/theme/ with color_tokens.dart, text_styles.dart, spacing.dart, app_theme.dart (light + dark)
- packages/chopfast_models/lib/src/ with order.dart, merchant.dart, menu_item.dart (all Freezed)
- Generated .freezed.dart and .g.dart files (after build_runner)
- All files import from correct packages (no relative path hacks)

---

## TEST 02 — Auth Flow (Customer App)
Prompt: "Using the chopfast-flutter-apps skill, implement the complete auth
feature for the customer app. Include phone OTP sign up, email+password login,
biometric login toggle, and Google Sign In. Use Riverpod for state, GoRouter
for redirects, and flutter_secure_storage for tokens."

Expected output:
- features/auth/data/auth_repository.dart (API calls via Dio)
- features/auth/domain/auth_notifier.dart (Riverpod)
- features/auth/presentation/screens/login_screen.dart
- features/auth/presentation/screens/signup_screen.dart (multi-step)
- features/auth/presentation/screens/otp_screen.dart (Pinput widget, 60s resend)
- GoRouter redirect: unauthenticated users → /login
- BiometricAuth integration in login screen
- Nigerian phone validation regex applied

---

## TEST 03 — Home Feed with Stories
Prompt: "Using the chopfast-flutter-apps skill, build the Home tab for the
customer app. Include the merchant Stories row, active order status card,
one-tap reorder strip, and restaurant discovery sections. Use Riverpod
providers and shimmer loading states."

Expected output:
- features/home/presentation/screens/home_screen.dart
- features/home/presentation/widgets/story_ring.dart (ring with gradient border)
- features/home/presentation/widgets/story_viewer.dart (full-screen, progress bar, swipe)
- features/home/presentation/widgets/active_order_card.dart
- features/home/presentation/widgets/reorder_strip.dart
- features/home/presentation/widgets/section_row.dart (reusable horizontal list section)
- Shimmer loading for all sections
- Pull-to-refresh

---

## TEST 04 — Live Order Tracking
Prompt: "Using the chopfast-flutter-apps skill, build the live order tracking
screen. Show a Google Map with animated rider marker, status timeline bottom
sheet, rider contact card, and ETA countdown. Connect to Socket.io
rider:location events."

Expected output:
- features/tracking/presentation/screens/tracking_screen.dart
- Google Maps with custom rider/restaurant/customer markers
- Smooth marker animation using MapService.animateMarker()
- DraggableScrollableSheet for status timeline (3 snap points)
- ETA countdown timer (updates every second)
- Socket.io subscription to 'rider:location:{orderId}'
- [Call Rider] and [Chat] buttons on rider card
- Report issue bottom sheet

---

## TEST 05 — Group Ordering
Prompt: "Using the chopfast-flutter-apps skill, implement the Group Order
feature. Allow user to create a session, share the code, see participants
adding items in real-time, and handle the host checkout flow. Use Socket.io
for live sync."

Expected output:
- features/group_order/data/group_order_repository.dart
- features/group_order/presentation/screens/create_group_screen.dart
- features/group_order/presentation/screens/group_session_screen.dart
- Participant list with avatars + their items (live via WebSocket)
- Share sheet integration (link + code)
- Session countdown timer
- Host-only checkout button
- "Waiting for X" status per participant

---

## TEST 06 — Merchant KDS Mode
Prompt: "Using the chopfast-flutter-apps skill, build the Kitchen Display
System (KDS) screen for the merchant app. Full-screen landscape layout,
3-column Kanban (Confirmed/Preparing/Ready), large readable text, prep
timers counting up, and PIN protection to enter/exit."

Expected output:
- features/orders/presentation/screens/kds_screen.dart
- Forced landscape orientation (SystemChrome.setPreferredOrientations)
- WakelockPlus.enable() on enter, disable on exit
- 3-column layout with large order cards
- Prep timer: counts up from order accepted (red when > 15 min)
- One-tap advance status button per card
- PIN entry widget to exit KDS mode
- flutter_tts integration for new order voice alert

---

## TEST 07 — Rider SOS System
Prompt: "Using the chopfast-flutter-apps skill, implement the SOS safety
button for the rider app. Include 2-second long press activation, countdown
confirmation, GPS location share to platform API, emergency SMS send to
2 contacts, and 60-second location broadcast loop."

Expected output:
- features/sos/presentation/widgets/sos_button.dart
- GestureDetector with onLongPress + 2s delay logic
- Confirmation dialog with countdown cancel
- API call: POST /rider/sos with { lat, lng, riderId }
- SMS send via url_launcher (sms: URI scheme as fallback)
- Periodic location broadcast using Timer.periodic (60s)
- Cancel SOS: stops broadcast, notifies API
- Emergency contacts setup screen in profile

---

## TEST 08 — Admin Command Center Map
Prompt: "Using the chopfast-flutter-apps skill, build the Operations Command
Center for the admin app. Full-screen Google Map with live dots for riders,
merchants, and active orders. Stats ribbon, tap-to-inspect any entity, and
anomaly alert badges."

Expected output:
- features/command_center/presentation/screens/command_center_screen.dart
- Google Maps with 3 marker types (custom icons per type)
- WebSocket subscription: 'ops:live_state' for all entity positions
- Stats ribbon: active orders, riders online, merchants open
- Bottom sheet on marker tap (rider/merchant/order detail)
- Alert badge on nav tab if anomalies exist
- City selector dropdown
- Heatmap layer toggle

---

## TEST 09 — Wallet & Withdrawal (Merchant)
Prompt: "Using the chopfast-flutter-apps skill, build the wallet screen
for the merchant app. Show available/pending balances, transaction ledger
with filters, and the full withdrawal flow: amount entry → bank selection
→ OTP → biometric confirm → success screen."

Expected output:
- features/wallet/presentation/screens/wallet_screen.dart (balance cards + ledger)
- features/wallet/presentation/screens/withdrawal_screen.dart (multi-step)
- NairaText widgets for all balance displays (JetBrains Mono font)
- Transaction list with type icons, colour coding, and filter tabs
- Withdrawal step 1: amount input with validation (min ₦1,000, max = available)
- Withdrawal step 2: bank account selector
- Withdrawal step 3: Pinput OTP entry + Termii send
- Withdrawal step 4: LocalAuth biometric confirmation
- Success screen with reference number + Lottie animation

---

## TEST 10 — Push Notifications + Deep Links
Prompt: "Using the chopfast-flutter-apps skill, implement the full push
notification system for the customer app. Handle FCM foreground/background/
terminated, create Android channels (orders, wallet, promos), and deep link
from notification tap to the correct screen."

Expected output:
- lib/app/notifications/push_service.dart (PushNotificationService)
- Android notification channels created on init
- Foreground: flutter_local_notifications shows in-app banner
- Background/terminated: GoRouter navigates on tap
- Deep link map: all 'type' values → correct GoRoute
- Notification permission request (iOS) with graceful decline handling
- FCM token registration to backend on login
- Token refresh listener

---

## TEST 11 — Affiliate Dashboard
Prompt: "Using the chopfast-flutter-apps skill, build the full Affiliate app
dashboard. Show earnings overview (today/month/lifetime), link management
with QR code + share sheet, performance analytics chart, and payout flow."

Expected output:
- Affiliate app scaffold with navigation (5 tabs)
- Dashboard: 3 KPI cards + recent conversions list
- Links screen: primary link + custom UTM links
- QR code generation (qr_flutter) → full-screen view → save to gallery
- Native share sheet (share_plus) with pre-written caption
- Performance: fl_chart LineChart (clicks vs conversions over time)
- Conversion rate calculation display
- Payout screen with bank account + withdraw flow

---

## TEST 12 — Dark Mode End-to-End
Prompt: "Using the chopfast-flutter-apps skill, implement complete dark mode
for the customer app. Create ThemeMode toggle in settings, ensure all screens
use ChopFastTheme tokens only (no hardcoded colors), add animated theme
transition, and persist user preference."

Expected output:
- Riverpod ThemeModeNotifier (persists to SharedPreferences)
- MaterialApp.router uses ref.watch(themeModeProvider)
- ChopFastTheme.light() and ChopFastTheme.dark() both complete
- ChopFastThemeExtension applied for all custom colors
- Settings screen: 3-segment ThemeMode selector
- AnimatedTheme wrapper for smooth transition
- Zero hardcoded Color() values in any presentation file
- ShimmerBox uses theme-aware shimmerBase/shimmerHighlight colors
