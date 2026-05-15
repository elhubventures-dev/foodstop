# Reference 01 — Monorepo Architecture

## Melos Configuration (melos.yaml)

```yaml
name: chopfast_flutter
repository: https://github.com/chopfast/chopfast-flutter

packages:
  - apps/**
  - packages/**

scripts:
  analyze:
    run: melos exec -- flutter analyze
    description: Analyze all packages

  test:
    run: melos exec -- flutter test
    description: Run all tests

  build_runner:
    run: melos exec --depends-on="build_runner" -- flutter pub run build_runner build --delete-conflicting-outputs
    description: Run code generation for all packages

  gen:
    run: melos run build_runner
    description: Alias for build_runner

  clean:
    run: melos exec -- flutter clean
    description: Clean all packages

  get:
    run: melos exec -- flutter pub get
    description: Get dependencies for all packages

  # Per-app build commands
  build:customer:android:
    run: melos exec --scope="customer" -- flutter build appbundle --flavor production -t lib/main_production.dart
  build:merchant:android:
    run: melos exec --scope="merchant" -- flutter build appbundle --flavor production -t lib/main_production.dart
  build:rider:android:
    run: melos exec --scope="rider" -- flutter build appbundle --flavor production -t lib/main_production.dart
  build:admin:android:
    run: melos exec --scope="admin" -- flutter build apk --flavor production -t lib/main_production.dart

ide:
  intellij: true
```

---

## Full Monorepo Folder Structure

```
chopfast_flutter/
│
├── melos.yaml
├── .github/
│   └── workflows/
│       ├── customer.yml
│       ├── merchant.yml
│       ├── rider.yml
│       ├── admin.yml
│       ├── driver_partner.yml
│       ├── business.yml
│       ├── affiliate.yml
│       └── packages.yml        # Test all shared packages
│
├── apps/
│   │
│   ├── customer/
│   │   ├── android/
│   │   │   └── app/src/
│   │   │       ├── main/           # production flavor
│   │   │       ├── staging/        # staging flavor
│   │   │       └── development/    # dev flavor
│   │   ├── ios/
│   │   │   └── Runner/
│   │   │       ├── Info.plist
│   │   │       └── GoogleService-Info.plist
│   │   ├── lib/
│   │   │   ├── main_development.dart
│   │   │   ├── main_staging.dart
│   │   │   ├── main_production.dart
│   │   │   ├── app/
│   │   │   │   ├── app.dart          # MaterialApp + GoRouter + ProviderScope
│   │   │   │   └── router.dart
│   │   │   └── features/
│   │   │       ├── onboarding/
│   │   │       │   ├── data/
│   │   │       │   ├── domain/
│   │   │       │   └── presentation/
│   │   │       │       ├── screens/
│   │   │       │       └── widgets/
│   │   │       ├── auth/
│   │   │       ├── home/
│   │   │       ├── restaurants/
│   │   │       ├── menu/
│   │   │       ├── cart/
│   │   │       ├── checkout/
│   │   │       ├── orders/
│   │   │       ├── tracking/
│   │   │       ├── group_order/
│   │   │       ├── stories/
│   │   │       ├── loyalty/
│   │   │       ├── gamification/
│   │   │       ├── profile/
│   │   │       ├── wallet/
│   │   │       ├── notifications/
│   │   │       └── search/
│   │   ├── test/
│   │   └── pubspec.yaml
│   │
│   ├── merchant/
│   │   └── lib/
│   │       └── features/
│   │           ├── auth/
│   │           ├── dashboard/
│   │           ├── orders/          # Kanban + KDS mode
│   │           ├── menu/
│   │           ├── wallet/
│   │           ├── analytics/
│   │           ├── reviews/
│   │           ├── promotions/
│   │           ├── settings/
│   │           └── team/
│   │
│   ├── rider/
│   │   └── lib/
│   │       └── features/
│   │           ├── auth/
│   │           ├── home/
│   │           ├── delivery/        # Active delivery flow
│   │           ├── earnings/
│   │           ├── heatmap/         # Zone density map
│   │           ├── sos/
│   │           └── history/
│   │
│   ├── admin/
│   │   └── lib/
│   │       └── features/
│   │           ├── auth/
│   │           ├── command_center/  # Live city map
│   │           ├── merchants/
│   │           ├── orders/
│   │           ├── financials/
│   │           ├── alerts/
│   │           └── settings/
│   │
│   ├── driver_partner/
│   │   └── lib/
│   │       └── features/
│   │           ├── auth/
│   │           ├── fleet/
│   │           ├── riders/
│   │           ├── earnings/
│   │           └── analytics/
│   │
│   ├── business/
│   │   └── lib/
│   │       └── features/
│   │           ├── auth/
│   │           ├── company/
│   │           ├── team_ordering/
│   │           ├── invoices/
│   │           ├── departments/
│   │           └── approvals/
│   │
│   └── affiliate/
│       └── lib/
│           └── features/
│               ├── auth/
│               ├── dashboard/
│               ├── links/
│               ├── earnings/
│               └── payouts/
│
└── packages/
    │
    ├── chopfast_ui/
    │   ├── lib/
    │   │   ├── chopfast_ui.dart     # barrel export
    │   │   ├── theme/
    │   │   │   ├── app_theme.dart
    │   │   │   ├── color_tokens.dart
    │   │   │   ├── text_styles.dart
    │   │   │   └── spacing.dart
    │   │   └── widgets/
    │   │       ├── buttons/
    │   │       ├── cards/
    │   │       ├── inputs/
    │   │       ├── navigation/
    │   │       ├── feedback/        # toasts, loaders, empty states
    │   │       └── layout/
    │   └── pubspec.yaml
    │
    ├── chopfast_api/
    │   ├── lib/
    │   │   ├── chopfast_api.dart
    │   │   ├── client/
    │   │   │   ├── dio_client.dart
    │   │   │   └── interceptors/
    │   │   │       ├── auth_interceptor.dart
    │   │   │       ├── logging_interceptor.dart
    │   │   │       └── retry_interceptor.dart
    │   │   └── endpoints/
    │   │       ├── auth_api.dart
    │   │       ├── restaurant_api.dart
    │   │       ├── order_api.dart
    │   │       ├── merchant_api.dart
    │   │       ├── wallet_api.dart
    │   │       └── rider_api.dart
    │   └── pubspec.yaml
    │
    ├── chopfast_auth/
    ├── chopfast_realtime/
    ├── chopfast_maps/
    ├── chopfast_payments/
    ├── chopfast_push/
    ├── chopfast_analytics/
    ├── chopfast_offline/
    └── chopfast_models/
```

---

## App Flavors (per app)

Each app has 3 flavors: development, staging, production.

### Android Flavor Setup (android/app/build.gradle)
```gradle
android {
    flavorDimensions "environment"
    productFlavors {
        development {
            dimension "environment"
            applicationId "ng.chopfast.customer.dev"
            versionNameSuffix "-dev"
            resValue "string", "app_name", "ChopFast DEV"
        }
        staging {
            dimension "environment"
            applicationId "ng.chopfast.customer.staging"
            versionNameSuffix "-staging"
            resValue "string", "app_name", "ChopFast STAGING"
        }
        production {
            dimension "environment"
            applicationId "ng.chopfast.customer"
            resValue "string", "app_name", "ChopFast"
        }
    }
}
```

### iOS Flavor Setup (via Xcode Schemes)
- Development scheme → Debug config → .dev bundle ID
- Staging scheme → Release config with staging API
- Production scheme → Release config + App Store submission

### Environment Config (per flavor)
```dart
// lib/main_production.dart
void main() {
  AppConfig.initialize(
    flavor: Flavor.production,
    apiBaseUrl: 'https://api.chopfast.ng',
    socketUrl: 'wss://api.chopfast.ng',
    paystackPublicKey: 'pk_live_xxxx',
    googleMapsKey: 'AIzaSy_prod_xxxx',
    sentryDsn: 'https://xxxx@sentry.io/xxxx',
  );
  runApp(const ProviderScope(child: ChopFastApp()));
}

// lib/main_development.dart
void main() {
  AppConfig.initialize(
    flavor: Flavor.development,
    apiBaseUrl: 'https://api-dev.chopfast.ng',
    socketUrl: 'wss://api-dev.chopfast.ng',
    paystackPublicKey: 'pk_test_xxxx',
    googleMapsKey: 'AIzaSy_dev_xxxx',
    sentryDsn: null,
  );
  runApp(const ProviderScope(child: ChopFastApp()));
}
```

---

## Shared Package: chopfast_models

All Freezed entities shared across apps. Never duplicate a model in an app.

```dart
// packages/chopfast_models/lib/src/order.dart

enum OrderStatus {
  pending, confirmed, preparing, ready,
  dispatched, delivered, cancelled, rejected
}

@freezed
class Order with _$Order {
  const factory Order({
    required String id,
    required String reference,
    required OrderStatus status,
    required Merchant merchant,
    required Customer customer,
    required List<OrderItem> items,
    required double subtotal,
    required double deliveryFee,
    required double vatAmount,
    required double grandTotal,
    required double commissionAmount,
    required double merchantNet,
    required OrderType type,
    required PaymentMethod paymentMethod,
    required bool isPaid,
    Address? deliveryAddress,
    Rider? assignedRider,
    String? specialInstructions,
    DateTime? estimatedDeliveryAt,
    required DateTime createdAt,
  }) = _Order;
  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}

@freezed
class Merchant with _$Merchant {
  const factory Merchant({
    required String id,
    required String slug,
    required String businessName,
    required String logoUrl,
    String? bannerUrl,
    required double avgRating,
    required int reviewCount,
    required bool isOpen,
    required double deliveryFee,
    required int estimatedDeliveryMinutes,
    required double distanceKm,
    required MerchantTier tier,
    required int minOrderAmount,
    List<String>? cuisineTypes,
    String? tagline,
  }) = _Merchant;
  factory Merchant.fromJson(Map<String, dynamic> json) => _$MerchantFromJson(json);
}

// ... all other models: Customer, Rider, MenuItem, Cart, Wallet,
// MerchantWallet, Withdrawal, Review, Notification, etc.
```

---

## Shared Package: chopfast_api

```dart
// packages/chopfast_api/lib/client/dio_client.dart

Dio createDio(Ref ref) {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  dio.interceptors.addAll([
    AuthInterceptor(ref),      // Injects Bearer token, handles 401 refresh
    RetryInterceptor(dio),     // Retries on 5xx, network errors (max 3x)
    LoggingInterceptor(),      // Dev only: pretty-prints requests
    ConnectivityInterceptor(ref), // Queues requests when offline
  ]);

  return dio;
}

// Auth Interceptor — handles token refresh transparently
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = SecureStorage.getAccessToken();
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        // Retry original request with new token
        handler.resolve(await _retry(err.requestOptions));
        return;
      }
      // Refresh failed → logout
      ref.read(authNotifierProvider.notifier).logout();
    }
    handler.next(err);
  }
}
```

---

## Shared Package: chopfast_offline

```dart
// Hive boxes for offline caching
class CacheBoxes {
  static const restaurants = 'restaurants_cache';
  static const menus = 'menus_cache';
  static const orders = 'orders_cache';
  static const profile = 'profile_cache';
  static const notifications = 'notifications_cache';
}

// Cache-first repository pattern
class RestaurantRepository {
  Future<List<Restaurant>> getNearbyRestaurants(LatLng location) async {
    // 1. Return cached data immediately (offline-first)
    final cached = await _cache.getRestaurants();
    if (cached.isNotEmpty) yield cached;  // Stream: emit cache first

    // 2. Fetch fresh data in background
    try {
      final fresh = await _api.getRestaurants(lat: location.lat, lng: location.lng);
      await _cache.saveRestaurants(fresh);
      yield fresh;  // Stream: emit fresh data when available
    } on DioException catch (e) {
      if (cached.isEmpty) throw e;  // Only throw if no cache to fall back on
      // Otherwise: silently use cached data, show "Showing saved results" badge
    }
  }
}
```
