# Reference 02 — Design System (chopfast_ui package)

## Color Tokens

```dart
// packages/chopfast_ui/lib/theme/color_tokens.dart

class ChopFastColors {
  // Brand
  static const primary       = Color(0xFFC8410B);  // Terracotta
  static const primaryLight  = Color(0xFFF4A87C);
  static const secondary     = Color(0xFFF5A623);  // Saffron Gold
  static const accent        = Color(0xFF2D6A4F);  // Forest Green

  // Light Mode Surfaces
  static const surfaceLight  = Color(0xFFFFFFFF);
  static const bgLight       = Color(0xFFF7F8FA);
  static const bgWarm        = Color(0xFFFFF8F0);  // Warm cream
  static const borderLight   = Color(0xFFE8ECF0);

  // Dark Mode Surfaces
  static const surfaceDark   = Color(0xFF1C1F26);
  static const bgDark        = Color(0xFF13151A);
  static const bgDark2       = Color(0xFF1E2128);
  static const borderDark    = Color(0xFF2E3039);

  // Text
  static const textPrimary   = Color(0xFF111827);
  static const textSecondary = Color(0xFF6B7280);
  static const textMuted     = Color(0xFF9CA3AF);
  static const textOnDark    = Color(0xFFF9FAFB);

  // Semantic
  static const success       = Color(0xFF22C55E);
  static const warning       = Color(0xFFF59E0B);
  static const error         = Color(0xFFEF4444);
  static const info          = Color(0xFF3B82F6);

  // Order Status Colors
  static const statusNew        = Color(0xFF3B82F6);  // Blue
  static const statusConfirmed  = Color(0xFF8B5CF6);  // Purple
  static const statusPreparing  = Color(0xFFF59E0B);  // Amber
  static const statusReady      = Color(0xFF22C55E);  // Green
  static const statusDispatched = Color(0xFF06B6D4);  // Cyan
  static const statusDelivered  = Color(0xFF6B7280);  // Grey
  static const statusCancelled  = Color(0xFFEF4444);  // Red

  // Merchant Tier Colors
  static const tierBronze   = Color(0xFFCD7F32);
  static const tierSilver   = Color(0xFF9CA3AF);
  static const tierGold     = Color(0xFFF59E0B);
  static const tierPlatinum = Color(0xFF7C3AED);
}
```

## App Theme

```dart
// packages/chopfast_ui/lib/theme/app_theme.dart

class ChopFastTheme {
  static ThemeData light() => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: ChopFastColors.primary,
      brightness: Brightness.light,
    ).copyWith(
      primary: ChopFastColors.primary,
      secondary: ChopFastColors.secondary,
      surface: ChopFastColors.surfaceLight,
      background: ChopFastColors.bgLight,
    ),
    textTheme: _buildTextTheme(Brightness.light),
    appBarTheme: const AppBarTheme(
      backgroundColor: ChopFastColors.surfaceLight,
      foregroundColor: ChopFastColors.textPrimary,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'CabinetGrotesk',
        fontSize: 18, fontWeight: FontWeight.w700,
        color: ChopFastColors.textPrimary,
      ),
    ),
    cardTheme: CardTheme(
      elevation: 0,
      color: ChopFastColors.surfaceLight,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(ChopFastSpacing.radiusLg),
        side: const BorderSide(color: ChopFastColors.borderLight, width: 1),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true, fillColor: ChopFastColors.bgLight,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ChopFastSpacing.radiusMd),
        borderSide: const BorderSide(color: ChopFastColors.borderLight),
      ),
    ),
    extensions: const [ChopFastThemeExtension.light()],
  );

  static ThemeData dark() => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: ChopFastColors.primary,
      brightness: Brightness.dark,
    ).copyWith(
      primary: ChopFastColors.primary,
      secondary: ChopFastColors.secondary,
      surface: ChopFastColors.surfaceDark,
      background: ChopFastColors.bgDark,
    ),
    textTheme: _buildTextTheme(Brightness.dark),
    // ... dark overrides
    extensions: const [ChopFastThemeExtension.dark()],
  );
}

// Theme extension for custom tokens not in Material 3
@immutable
class ChopFastThemeExtension extends ThemeExtension<ChopFastThemeExtension> {
  final Color cardBg;
  final Color inputBg;
  final Color divider;
  final Color shimmerBase;
  final Color shimmerHighlight;

  const ChopFastThemeExtension.light() :
    cardBg = ChopFastColors.surfaceLight,
    inputBg = ChopFastColors.bgLight,
    divider = ChopFastColors.borderLight,
    shimmerBase = const Color(0xFFE8ECF0),
    shimmerHighlight = const Color(0xFFF5F5F5);

  const ChopFastThemeExtension.dark() :
    cardBg = ChopFastColors.surfaceDark,
    inputBg = ChopFastColors.bgDark2,
    divider = ChopFastColors.borderDark,
    shimmerBase = const Color(0xFF2E3039),
    shimmerHighlight = const Color(0xFF3A3D47);
  // ...
}
```

## Spacing System

```dart
class ChopFastSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;
  static const xxxl = 64.0;

  // Border radius
  static const radiusSm   = 6.0;
  static const radiusMd   = 10.0;
  static const radiusLg   = 16.0;
  static const radiusXl   = 24.0;
  static const radiusFull = 999.0;

  // Minimum tap target (accessibility)
  static const minTapTarget = 44.0;
}
```

## Core Reusable Widgets

### ChopFastButton
```dart
// Three variants: primary, secondary, ghost
class ChopFastButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool isLoading;
  final bool isFullWidth;
  final IconData? leadingIcon;

  // primary: filled terracotta, white text
  // secondary: outlined terracotta
  // ghost: text only, terracotta text

  @override
  Widget build(BuildContext context) {
    return AnimatedScale( // Press animation
      scale: _isPressed ? 0.97 : 1.0,
      duration: const Duration(milliseconds: 80),
      child: /* ... button widget */,
    );
  }
}
```

### FoodCard
```dart
class FoodCard extends StatelessWidget {
  final MenuItem item;
  final VoidCallback onAddToCart;
  final VoidCallback? onTap;
  final bool showMerchantName; // true on search/discovery screens

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(ChopFastSpacing.radiusLg),
          border: Border.all(color: context.chopFastTheme.divider),
        ),
        child: Column(children: [
          // Image with badge overlays (Bestseller, New, Chef's Pick)
          Stack(children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(ChopFastSpacing.radiusLg)
              ),
              child: CachedNetworkImage(
                imageUrl: item.imageUrl,
                height: 160, width: double.infinity, fit: BoxFit.cover,
                placeholder: (ctx, url) => ShimmerBox(height: 160),
                errorWidget: (ctx, url, e) => FoodImagePlaceholder(),
              ),
            ),
            if (item.badges.isNotEmpty) BadgeRow(badges: item.badges),
            Positioned(
              top: 8, right: 8,
              child: FavouriteButton(itemId: item.id),
            ),
          ]),
          Padding(
            padding: const EdgeInsets.all(ChopFastSpacing.md),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.name, style: context.textTheme.titleSmall),
              if (showMerchantName)
                Text(item.merchantName, style: context.textTheme.bodySmall
                  ..copyWith(color: ChopFastColors.primary)),
              const SizedBox(height: 4),
              Row(children: [
                SpiceIndicator(level: item.spiceLevel),
                const Spacer(),
                StarRating(rating: item.rating, count: item.reviewCount),
              ]),
              const SizedBox(height: ChopFastSpacing.sm),
              Row(children: [
                NairaText(amount: item.price, style: titleMedium),
                if (item.salePrice != null) ...[
                  const SizedBox(width: 8),
                  NairaText(amount: item.salePrice!, strikethrough: true),
                ],
                const Spacer(),
                AddToCartButton(item: item, onPressed: onAddToCart),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}
```

### RestaurantCard
```dart
class RestaurantCard extends StatelessWidget {
  final Merchant merchant;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      // Banner + Logo + Name + Rating + Distance + ETA + Status badge
      // Featured merchants get gold border + "FEATURED" ribbon
      // Closed merchants get greyed overlay + "CLOSED" badge
    ),
  );
}
```

### ShimmerBox (skeleton loader)
```dart
class ShimmerBox extends StatelessWidget {
  final double height;
  final double? width;
  final double radius;

  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
    baseColor: context.chopFastTheme.shimmerBase,
    highlightColor: context.chopFastTheme.shimmerHighlight,
    child: Container(
      height: height, width: width ?? double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(radius),
      ),
    ),
  );
}
```

### OrderStatusBadge
```dart
class OrderStatusBadge extends StatelessWidget {
  final OrderStatus status;

  Color get _color => switch (status) {
    OrderStatus.pending    => ChopFastColors.statusNew,
    OrderStatus.confirmed  => ChopFastColors.statusConfirmed,
    OrderStatus.preparing  => ChopFastColors.statusPreparing,
    OrderStatus.ready      => ChopFastColors.statusReady,
    OrderStatus.dispatched => ChopFastColors.statusDispatched,
    OrderStatus.delivered  => ChopFastColors.statusDelivered,
    OrderStatus.cancelled  => ChopFastColors.statusCancelled,
    OrderStatus.rejected   => ChopFastColors.statusCancelled,
  };

  String get _label => status.name.toUpperCase();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: _color.withOpacity(0.15),
      borderRadius: BorderRadius.circular(ChopFastSpacing.radiusFull),
      border: Border.all(color: _color.withOpacity(0.4)),
    ),
    child: Text(_label, style: TextStyle(
      color: _color, fontSize: 11, fontWeight: FontWeight.w700,
    )),
  );
}
```

### NairaText
```dart
class NairaText extends StatelessWidget {
  final double amount;
  final TextStyle? style;
  final bool strikethrough;

  @override
  Widget build(BuildContext context) => Text(
    amount.toNaira(),
    style: (style ?? context.textTheme.bodyMedium)?.copyWith(
      fontFamily: 'JetBrainsMono',
      decoration: strikethrough ? TextDecoration.lineThrough : null,
      color: strikethrough ? ChopFastColors.textMuted : null,
    ),
  );
}
```

### OtpInput
```dart
class OtpInput extends StatelessWidget {
  final int length;               // default 6
  final ValueChanged<String> onCompleted;
  final bool autoFocus;

  // 6 individual pin-entry boxes with auto-advance
  // Shows error shake animation on wrong OTP
  // "Resend" button with 60s countdown timer
}
```

### Toast Notification System
```dart
// Show anywhere without BuildContext via global key
ChopFastToast.show(
  message: 'Item added to cart!',
  type: ToastType.success,
  action: ToastAction(label: 'View Cart', onTap: () => cartRoute.go(context)),
);
// Slides in from top, auto-dismisses after 3.5s
// Stacks up to 3 toasts, oldest dismissed first
```

## Animation Constants

```dart
class ChopFastAnimations {
  static const pageFadeIn   = Duration(milliseconds: 250);
  static const slideUp      = Duration(milliseconds: 300);
  static const cartBounce   = Duration(milliseconds: 400);
  static const buttonPress  = Duration(milliseconds: 80);
  static const mapPin       = Duration(milliseconds: 800);  // Rider movement
  static const shimmer      = Duration(milliseconds: 1200);
  static const toastSlide   = Duration(milliseconds: 200);
  static const staggerDelay = Duration(milliseconds: 60);  // Between list items
}

// Page transition — fade + slight upward slide
class ChopFastPageTransition extends CustomTransitionPage {
  ChopFastPageTransition({required Widget child})
    : super(
        child: child,
        transitionsBuilder: (ctx, animation, _, child) =>
          FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.04),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
              child: child,
            ),
          ),
      );
}
```

## Bottom Navigation Pattern (Customer & Merchant Apps)

```dart
// Persistent bottom nav with label animation on select
class MainScaffold extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onDestinationSelected,
        destinations: const [
          NavigationDestination(icon: Icon(PhosphorIcons.house), label: 'Home'),
          NavigationDestination(icon: Icon(PhosphorIcons.fork_knife), label: 'Menu'),
          NavigationDestination(icon: Icon(PhosphorIcons.shopping_bag), label: 'Orders'),
          NavigationDestination(icon: Icon(PhosphorIcons.star), label: 'Rewards'),
          NavigationDestination(icon: Icon(PhosphorIcons.user), label: 'Profile'),
        ],
      ),
    );
  }
}
```
