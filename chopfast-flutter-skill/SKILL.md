---
name: chopfast-flutter-apps
version: 1.0.0
description: >
  Complete Flutter (Dart) skill for building the full ChopFast mobile app suite.
  Transforms the ChopFast multi-vendor food marketplace platform into a production-ready
  Flutter monorepo containing 7 apps: Customer App, Merchant App, Rider App,
  Super Admin App, Driver Partner App, ChopFast for Business (B2B) App, and
  Affiliate App. All 27 approved features are included. Uses Flutter 3.x + Dart 3,
  Clean Architecture with feature modules, Riverpod for state management, GoRouter
  for navigation, Dio for networking, and Paystack Flutter SDK for payments.
  Trigger this skill for any ChopFast mobile development task.
---

# ChopFast Flutter App Suite — Master Skill

## READ ORDER (mandatory before writing any code)

1. **This file** — architecture decisions, monorepo structure, build order, shared systems
2. `references/01-monorepo-architecture.md` — folder structure, shared packages, flavors
3. `references/02-design-system.md` — tokens, components, dark mode, animations
4. `references/03-customer-app.md` — all 10 customer app features + screens
5. `references/04-merchant-app.md` — all 7 merchant app features + KDS mode
6. `references/05-rider-app.md` — all 5 rider app features + SOS system
7. `references/06-admin-app.md` — super admin command center + anomaly alerts
8. `references/07-standalone-apps.md` — Driver Partner, B2B, Affiliate apps
9. `references/08-shared-systems.md` — auth, push notifications, offline, real-time
10. `references/09-ci-cd-release.md` — GitHub Actions, Fastlane, Play Store, App Store
11. `assets/test-cases.md` — 12 test prompts with expected outputs
12. `assets/pubspec-dependencies.md` — all Flutter packages with versions

---

## FRAMEWORK DECISION RECORD

**Chosen:** Flutter 3.x + Dart 3
**Why over React Native for ChopFast specifically:**
- 7 apps, 1 codebase, 1 language — Dart compiles to native ARM on both platforms
- Flutter's Skia/Impeller renderer gives pixel-identical UI across Android + iOS
- Real-time map tracking (rider GPS) performs significantly better in Flutter
- Riverpod + Flutter Hooks = predictable state for complex order flows
- flutter_paystack is maintained by Paystack's official partner
- Google Maps Flutter SDK is first-party
- Firebase suite has official Flutter plugins for all services
- Hot reload + Dart's null safety = safer, faster development

---

## GUIDING PRINCIPLES

1. **One monorepo, seven apps** — all apps live in `/apps/`, all shared code in `/packages/`
2. **Feature-first, not layer-first** — organize by feature (auth, orders, wallet) not by type (models, services, screens)
3. **Clean Architecture per feature** — every feature has `data/`, `domain/`, `presentation/` layers
4. **Riverpod everywhere** — no setState, no BLoC, no Provider — Riverpod with code generation
5. **GoRouter for navigation** — declarative, deep-link capable, type-safe routes
6. **Offline-first** — every list screen works from cache; network is enhancement, not requirement
7. **Nigerian-first UX** — Naira formatting, Nigerian phone validation, landmark addressing, Lagos traffic awareness
8. **Accessibility** — minimum 44pt tap targets, semantic labels, sufficient contrast
9. **Performance budget** — app launch < 2s cold start, list scroll at 60fps, map update < 100ms

---

## THE 7 APPS

| App | Package ID | Primary Users | Key Differentiator |
|---|---|---|---|
| Customer | ng.chopfast.customer | End customers | Group ordering, AR preview, Stories |
| Merchant | ng.chopfast.merchant | Restaurant owners | KDS mode, voice alerts, home widget |
| Rider | ng.chopfast.rider | Delivery riders | Zone heatmap, SOS, streak bonuses |
| Super Admin | ng.chopfast.admin | Platform operators | Live city map, anomaly alerts |
| Driver Partner | ng.chopfast.driver | Fleet owners | Multi-rider management, fleet analytics |
| Business (B2B) | ng.chopfast.business | Corporate accounts | Department ordering, monthly invoicing |
| Affiliate | ng.chopfast.affiliate | Content creators | Real-time commission tracking |

---

## MONOREPO STRUCTURE (top-level)

```
chopfast_flutter/
├── apps/
│   ├── customer/          # ng.chopfast.customer
│   ├── merchant/          # ng.chopfast.merchant
│   ├── rider/             # ng.chopfast.rider
│   ├── admin/             # ng.chopfast.admin
│   ├── driver_partner/    # ng.chopfast.driver
│   ├── business/          # ng.chopfast.business
│   └── affiliate/         # ng.chopfast.affiliate
│
├── packages/
│   ├── chopfast_ui/        # Design system: tokens, components, theme
│   ├── chopfast_api/       # Dio HTTP client, interceptors, endpoints
│   ├── chopfast_auth/      # JWT auth, biometrics, secure storage
│   ├── chopfast_realtime/  # Socket.io client, WebSocket streams
│   ├── chopfast_maps/      # Google Maps wrapper, location services
│   ├── chopfast_payments/  # Paystack SDK wrapper
│   ├── chopfast_push/      # Firebase Messaging abstraction
│   ├── chopfast_analytics/ # Firebase Analytics + custom events
│   ├── chopfast_offline/   # Hive cache, sync queue, connectivity
│   └── chopfast_models/    # Freezed domain models shared across apps
│
├── melos.yaml              # Monorepo manager
├── .github/workflows/      # CI/CD per app
└── README.md
```

See `references/01-monorepo-architecture.md` for full detail.

---

## BUILD ORDER

```
Phase 1 — Foundation (Gate: melos bootstrap runs clean, shared packages build)
  ├── Monorepo setup with Melos
  ├── chopfast_models (Freezed entities)
  ├── chopfast_ui (design system + theme)
  ├── chopfast_api (Dio client + interceptors)
  └── chopfast_auth (JWT + biometrics)

Phase 2 — Core Infrastructure (Gate: login works in all 3 main apps)
  ├── chopfast_realtime (Socket.io streams)
  ├── chopfast_maps (Maps + location)
  ├── chopfast_payments (Paystack)
  ├── chopfast_push (FCM)
  └── chopfast_offline (Hive + sync)

Phase 3 — Customer App (Gate: order placed end-to-end)
  ├── Auth + onboarding
  ├── Home feed + Stories
  ├── Restaurant discovery + storefront
  ├── Menu catalog + cart
  ├── Checkout + Paystack
  ├── Live order tracking
  ├── Group ordering
  └── Loyalty + gamification

Phase 4 — Merchant App (Gate: order received and actioned)
  ├── Auth + onboarding wizard
  ├── Dashboard + KDS mode
  ├── Live orders (WebSocket Kanban)
  ├── Menu management
  ├── Wallet + withdrawals
  └── Voice alerts + home widget

Phase 5 — Rider App (Gate: delivery completed end-to-end)
  ├── Auth + profile
  ├── Live order acceptance
  ├── Navigation + status updates
  ├── Earnings + zone heatmap
  └── SOS system

Phase 6 — Super Admin App (Gate: admin can see live city state)
  ├── Auth + 2FA
  ├── Operations command center (city map)
  ├── Merchant management
  ├── Anomaly alert system
  └── Financial overview

Phase 7 — Standalone Apps
  ├── Driver Partner App
  ├── B2B Business App
  └── Affiliate App

Phase 8 — Polish + Release
  ├── Dark mode throughout
  ├── Offline mode + sync
  ├── Accessibility audit
  ├── Performance profiling
  └── CI/CD + App Store / Play Store release
```

---

## SHARED SYSTEMS QUICK REFERENCE

### State Management: Riverpod + Code Generation
```dart
// Every feature exports providers — never raw classes
@riverpod
class OrdersNotifier extends _$OrdersNotifier {
  @override
  FutureOr<List<Order>> build() => ref.watch(orderRepositoryProvider).getLiveOrders();
}

// In widget:
final orders = ref.watch(ordersNotifierProvider);
```

### Navigation: GoRouter
```dart
// Type-safe routes using go_router_builder
@TypedGoRoute<HomeRoute>(path: '/')
class HomeRoute extends GoRouteData { ... }

// Navigate:
const RestaurantRoute(slug: 'mama-titi').go(context);
```

### API Calls: Dio + Retrofit
```dart
@RestApi(baseUrl: '')
abstract class ChopFastApi {
  factory ChopFastApi(Dio dio) = _ChopFastApi;

  @GET('/restaurants')
  Future<PaginatedResponse<Restaurant>> getRestaurants(
    @Query('lat') double lat,
    @Query('lng') double lng,
  );
}
```

### Models: Freezed + JSON Serializable
```dart
@freezed
class Order with _$Order {
  const factory Order({
    required String id,
    required String reference,
    required OrderStatus status,
    required Merchant merchant,
    required List<OrderItem> items,
    required Money total,
  }) = _Order;

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}
```

### Currency Formatting (Nigerian Naira)
```dart
// In chopfast_ui package — always use this, never raw toString
extension MoneyFormatter on double {
  String toNaira() {
    final formatter = NumberFormat.currency(
      locale: 'en_NG', symbol: '₦', decimalDigits: 0,
    );
    return formatter.format(this);
  }
}
// Usage: order.total.toNaira() → "₦4,200"
```
