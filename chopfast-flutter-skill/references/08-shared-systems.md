# Reference 08 — Shared Systems

## chopfast_auth Package

```dart
// packages/chopfast_auth/lib/src/auth_service.dart

class AuthService {
  final FlutterSecureStorage _storage;
  final Dio _dio;

  // ── Token Management ──────────────────────────────────────
  Future<void> saveTokens(String access, String refresh) async {
    await Future.wait([
      _storage.write(key: 'access_token', value: access),
      _storage.write(key: 'refresh_token', value: refresh),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: 'access_token');
  Future<String?> getRefreshToken() => _storage.read(key: 'refresh_token');

  Future<bool> refreshTokens() async {
    final refresh = await getRefreshToken();
    if (refresh == null) return false;
    try {
      final resp = await _dio.post('/auth/refresh-token',
        data: {'refreshToken': refresh});
      await saveTokens(resp.data['accessToken'], resp.data['refreshToken']);
      return true;
    } catch (_) {
      await clearTokens();
      return false;
    }
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: 'access_token'),
      _storage.delete(key: 'refresh_token'),
    ]);
  }

  // ── Biometric Auth ────────────────────────────────────────
  Future<bool> isBiometricAvailable() async {
    final auth = LocalAuthentication();
    return await auth.canCheckBiometrics && await auth.isDeviceSupported();
  }

  Future<bool> authenticateWithBiometric({
    required String reason,
  }) async {
    final auth = LocalAuthentication();
    try {
      return await auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false,    // Allow PIN fallback
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    }
  }

  // ── Nigerian Phone Validation ─────────────────────────────
  static bool isValidNigerianPhone(String phone) {
    // Matches: 080XXXXXXXX, 090XXXXXXXX, +2348XXXXXXXXX, 07XXXXXXXXX
    final regex = RegExp(r'^(\+234|0)[789][01]\d{8}$');
    return regex.hasMatch(phone.replaceAll(' ', ''));
  }

  static String normalizeNigerianPhone(String phone) {
    phone = phone.replaceAll(' ', '').replaceAll('-', '');
    if (phone.startsWith('0')) return '+234${phone.substring(1)}';
    if (phone.startsWith('234')) return '+$phone';
    return phone;
  }
}

// ── Auth State ────────────────────────────────────────────────
@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  FutureOr<AuthState> build() async {
    final token = await ref.read(authServiceProvider).getAccessToken();
    if (token == null) return const AuthState.unauthenticated();
    // Validate token + load user profile
    try {
      final user = await ref.read(userApiProvider).getProfile();
      return AuthState.authenticated(user: user);
    } catch (_) {
      return const AuthState.unauthenticated();
    }
  }

  Future<void> logout() async {
    await ref.read(authServiceProvider).clearTokens();
    await ref.read(pushNotificationProvider).unregisterDevice();
    state = const AsyncData(AuthState.unauthenticated());
  }
}

@freezed
class AuthState with _$AuthState {
  const factory AuthState.authenticated({required User user}) = Authenticated;
  const factory AuthState.unauthenticated() = Unauthenticated;
}
```

---

## chopfast_realtime Package

```dart
// packages/chopfast_realtime/lib/src/realtime_service.dart

class RealtimeService {
  late IO.Socket _socket;
  final _streams = <String, StreamController<dynamic>>{};

  void connect(String namespace, String token) {
    _socket = IO.io(
      '${AppConfig.socketUrl}$namespace',
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .enableReconnection()
        .setReconnectionDelay(1000)
        .setReconnectionAttempts(double.infinity)
        .setAuth({'token': token})
        .build(),
    );

    _socket.onConnect((_) {
      debugPrint('✅ Socket connected: $namespace');
    });

    _socket.onDisconnect((_) {
      debugPrint('❌ Socket disconnected: $namespace');
    });

    _socket.onReconnect((_) {
      debugPrint('🔄 Socket reconnecting: $namespace');
      // Re-subscribe to all active streams
      _resubscribeAll();
    });
  }

  // Subscribe to an event, returns a broadcast stream
  Stream<T> on<T>(String event, T Function(dynamic) parser) {
    if (!_streams.containsKey(event)) {
      _streams[event] = StreamController<dynamic>.broadcast();
      _socket.on(event, (data) => _streams[event]!.add(data));
    }
    return _streams[event]!.stream.map(parser);
  }

  void emit(String event, dynamic data) => _socket.emit(event, data);

  void disconnect() {
    _socket.dispose();
    for (final ctrl in _streams.values) ctrl.close();
    _streams.clear();
  }
}

// ── Usage in Customer App ─────────────────────────────────────
// In tracking screen:
final riderLocations = ref.watch(
  realtimeServiceProvider.select((svc) => svc.on<LatLng>(
    'rider:location:${orderId}',
    (data) => LatLng(data['lat'] as double, data['lng'] as double),
  ))
);

// In merchant app:
final newOrders = ref.watch(
  realtimeServiceProvider.select((svc) => svc.on<Order>(
    'new_order',
    (data) => Order.fromJson(data as Map<String, dynamic>),
  ))
);
```

---

## chopfast_payments Package (Paystack)

```dart
// packages/chopfast_payments/lib/src/payment_service.dart

class PaymentService {
  final plugin = PaystackPlugin();

  Future<void> initialize() async {
    await plugin.initialize(publicKey: AppConfig.paystackPublicKey);
  }

  // Inline Paystack payment (opens Paystack UI)
  Future<PaymentResult> charge({
    required BuildContext context,
    required String email,
    required double amountInNaira,
    required String reference,
    String? cardNumber,       // For saved cards
    List<PaymentChannel>? channels,
  }) async {
    final charge = Charge()
      ..amount = (amountInNaira * 100).toInt()   // Paystack uses kobo
      ..email = email
      ..reference = reference
      ..currency = 'NGN'
      ..channels = channels ?? [
          PaymentChannel.card,
          PaymentChannel.bank,
          PaymentChannel.ussd,
          PaymentChannel.mobileMoney,
          PaymentChannel.bankTransfer,
        ];

    final response = await plugin.checkout(
      context,
      charge: charge,
      method: CheckoutMethod.selectable,
      fullscreen: false,
      logo: const ChopFastLogoWidget(),
    );

    if (response.status && response.reference != null) {
      // IMPORTANT: Always verify on backend — never trust frontend confirmation
      final verified = await _verifyOnBackend(response.reference!);
      return verified
        ? PaymentResult.success(reference: response.reference!)
        : PaymentResult.failed(message: 'Verification failed');
    }

    return PaymentResult.failed(message: response.message ?? 'Payment cancelled');
  }

  // Split payment: charge individual's share
  Future<PaymentResult> chargeSplit({
    required BuildContext context,
    required SplitPaymentSession session,
    required String participantEmail,
    required double shareAmount,
  }) async {
    return charge(
      context: context,
      email: participantEmail,
      amountInNaira: shareAmount,
      reference: '${session.reference}_${participantEmail.split('@').first}',
    );
  }

  Future<bool> _verifyOnBackend(String reference) async {
    // POST /payments/verify with reference
    // Backend confirms with Paystack server-to-server
    // Never trust frontend payment status alone
    try {
      final resp = await ref.read(apiProvider).verifyPayment(reference);
      return resp.status == 'success';
    } catch (_) {
      return false;
    }
  }
}
```

---

## chopfast_push Package (Firebase Cloud Messaging)

```dart
// packages/chopfast_push/lib/src/push_service.dart

class PushNotificationService {
  final _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permissions (iOS)
    await _messaging.requestPermission(
      alert: true, badge: true, sound: true,
      criticalAlert: true,  // For merchant new-order alerts
    );

    // Get + save FCM token to backend
    final token = await _messaging.getToken();
    if (token != null) await _registerDeviceToken(token);

    // Handle token refresh
    _messaging.onTokenRefresh.listen(_registerDeviceToken);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification tap when app is background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from terminated state via notification
    final initial = await _messaging.getInitialMessage();
    if (initial != null) _handleNotificationTap(initial);

    // Android: create notification channels
    await _createNotificationChannels();
  }

  Future<void> _createNotificationChannels() async {
    // Different channels for different alert types
    const channels = [
      AndroidNotificationChannel(
        'new_orders',
        'New Orders',
        description: 'New order alerts for merchants',
        importance: Importance.max,
        sound: RawResourceAndroidNotificationSound('kitchen_bell'),
        enableVibration: true,
      ),
      AndroidNotificationChannel(
        'order_updates',
        'Order Updates',
        description: 'Order status updates for customers',
        importance: Importance.high,
      ),
      AndroidNotificationChannel(
        'wallet',
        'Wallet & Payments',
        description: 'Payment and wallet notifications',
        importance: Importance.high,
      ),
      AndroidNotificationChannel(
        'promotions',
        'Promotions',
        description: 'Deals and promotional offers',
        importance: Importance.defaultImportance,
      ),
    ];
    // Register channels via flutter_local_notifications
  }

  // Deep link routing from notification tap
  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    switch (type) {
      case 'new_order':
        OrdersRoute().go(navigatorKey.currentContext!);
      case 'order_update':
        TrackingRoute(orderId: id!).go(navigatorKey.currentContext!);
      case 'wallet_credit':
        WalletRoute().go(navigatorKey.currentContext!);
      case 'payout_status':
        WithdrawalsRoute().go(navigatorKey.currentContext!);
      case 'merchant_alert':
        MerchantAlertRoute(alertId: id!).go(navigatorKey.currentContext!);
    }
  }
}
```

---

## Google Maps Integration (chopfast_maps)

```dart
// packages/chopfast_maps/lib/src/map_service.dart

class MapService {
  // Nigerian-focused map configuration
  static const nigeriaCenter = CameraPosition(
    target: LatLng(9.0820, 8.6753),  // Nigeria center
    zoom: 6,
  );

  static const lagosBounds = LatLngBounds(
    southwest: LatLng(6.3573, 2.7680),
    northeast: LatLng(6.7046, 3.7200),
  );

  // Custom map style (dark mode aware)
  static Future<String> getMapStyle(bool isDark) async {
    return isDark
      ? await rootBundle.loadString('assets/map_styles/dark.json')
      : await rootBundle.loadString('assets/map_styles/light.json');
  }

  // Custom marker bitmaps (cached after first creation)
  static Future<BitmapDescriptor> getRiderMarker() =>
    BitmapDescriptor.fromAssetImage(
      const ImageConfiguration(size: Size(48, 48)),
      'packages/chopfast_maps/assets/rider_marker.png',
    );

  static Future<BitmapDescriptor> getRestaurantMarker() =>
    BitmapDescriptor.fromAssetImage(
      const ImageConfiguration(size: Size(40, 40)),
      'packages/chopfast_maps/assets/restaurant_pin.png',
    );

  // Smooth marker animation (for rider movement)
  static Future<void> animateMarker({
    required GoogleMapController controller,
    required MarkerId markerId,
    required LatLng from,
    required LatLng to,
    required Duration duration,
    required void Function(Marker) onUpdate,
  }) async {
    const steps = 60;
    final stepDuration = duration ~/ steps;

    for (var i = 1; i <= steps; i++) {
      final t = i / steps;
      final lat = from.latitude + (to.latitude - from.latitude) * t;
      final lng = from.longitude + (to.longitude - from.longitude) * t;

      onUpdate(Marker(
        markerId: markerId,
        position: LatLng(lat, lng),
        icon: await getRiderMarker(),
        rotation: _bearingBetween(from, to),
      ));

      await Future.delayed(stepDuration);
    }
  }

  // Calculate bearing for marker rotation (faces direction of travel)
  static double _bearingBetween(LatLng from, LatLng to) {
    final lat1 = from.latitude * pi / 180;
    final lat2 = to.latitude * pi / 180;
    final dLng = (to.longitude - from.longitude) * pi / 180;
    final y = sin(dLng) * cos(lat2);
    final x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLng);
    return (atan2(y, x) * 180 / pi + 360) % 360;
  }

  // Places Autocomplete (Nigerian addresses)
  static Future<List<PlacePrediction>> searchAddress(String query) async {
    final resp = await http.get(Uri.parse(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json'
      '?input=${Uri.encodeComponent(query)}'
      '&components=country:ng'         // Nigeria only
      '&types=geocode|establishment'
      '&key=${AppConfig.googleMapsKey}'
    ));
    // Parse + return predictions
  }

  // Reverse geocode: LatLng → human-readable address
  static Future<String> reverseGeocode(LatLng position) async {
    final placemarks = await placemarkFromCoordinates(
      position.latitude, position.longitude,
    );
    if (placemarks.isEmpty) return '${position.latitude}, ${position.longitude}';
    final p = placemarks.first;
    return [p.street, p.subLocality, p.locality]
      .where((s) => s != null && s.isNotEmpty)
      .join(', ');
  }
}
```

---

## Offline System (chopfast_offline)

```dart
// packages/chopfast_offline/lib/src/cache_manager.dart

class CacheManager {
  static late Box<String> _restaurantsBox;
  static late Box<String> _menusBox;
  static late Box<String> _ordersBox;
  static late Box<String> _profileBox;

  static Future<void> initialize() async {
    await Hive.initFlutter();
    _restaurantsBox = await Hive.openBox<String>('restaurants');
    _menusBox       = await Hive.openBox<String>('menus');
    _ordersBox      = await Hive.openBox<String>('orders');
    _profileBox     = await Hive.openBox<String>('profile');
  }

  // Cache with TTL
  static Future<void> cacheRestaurants(List<Restaurant> restaurants) async {
    final data = CacheEntry(
      data: jsonEncode(restaurants.map((r) => r.toJson()).toList()),
      cachedAt: DateTime.now(),
      ttl: const Duration(minutes: 30),
    );
    await _restaurantsBox.put('nearby', jsonEncode(data.toJson()));
  }

  static List<Restaurant>? getCachedRestaurants() {
    final raw = _restaurantsBox.get('nearby');
    if (raw == null) return null;
    final entry = CacheEntry.fromJson(jsonDecode(raw));
    if (entry.isExpired) return null;
    return (jsonDecode(entry.data) as List)
      .map((j) => Restaurant.fromJson(j)).toList();
  }
}

// Connectivity monitoring
@riverpod
class ConnectivityNotifier extends _$ConnectivityNotifier {
  @override
  Stream<ConnectivityStatus> build() {
    return Connectivity()
      .onConnectivityChanged
      .map((result) => result == ConnectivityResult.none
        ? ConnectivityStatus.offline
        : ConnectivityStatus.online);
  }
}

// Offline banner widget
class OfflineBanner extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(connectivityNotifierProvider).valueOrNull;
    if (status != ConnectivityStatus.offline) return const SizedBox.shrink();

    return AnimatedSlide(
      offset: Offset.zero,
      duration: ChopFastAnimations.slideUp,
      child: Container(
        width: double.infinity,
        color: ChopFastColors.warning,
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
        child: Row(children: [
          const Icon(PhosphorIcons.wifi_slash, color: Colors.white, size: 16),
          const SizedBox(width: 8),
          Text('You\'re offline — showing saved results',
            style: const TextStyle(color: Colors.white, fontSize: 12)),
        ]),
      ),
    );
  }
}
```
