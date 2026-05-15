# ChopFast Flutter App Suite — Skill Package
## Version 1.0.0 | Flutter 3.22+ | Dart 3.4+

This skill transforms the ChopFast multi-vendor food marketplace platform
into a complete Flutter mobile app suite for Android and iOS.

---

## WHAT'S INCLUDED

### 7 Flutter Apps
| App | Package ID | Screens |
|---|---|---|
| Customer | ng.chopfast.customer | ~40 screens |
| Merchant | ng.chopfast.merchant | ~25 screens |
| Rider | ng.chopfast.rider | ~15 screens |
| Super Admin | ng.chopfast.admin | ~12 screens |
| Driver Partner | ng.chopfast.driver | ~10 screens |
| B2B Business | ng.chopfast.business | ~15 screens |
| Affiliate | ng.chopfast.affiliate | ~8 screens |

### 10 Shared Packages
chopfast_ui · chopfast_api · chopfast_auth · chopfast_realtime ·
chopfast_maps · chopfast_payments · chopfast_push · chopfast_analytics ·
chopfast_offline · chopfast_models

### All 27 Approved Features
✅ Dark Mode · Offline Mode · AR Food Preview (V2) · One-Tap Reorder ·
Real-Time Chat · Group Ordering · Recurring Orders · Stories/Reels ·
Gamification (Scratch, Spin, Streaks) · Split Payment · KDS Mode ·
Revenue Widget · Photo Shoot Mode · Voice Alerts · Barcode Scanner ·
Streak Bonuses · SOS Safety · Rider Chat · Zone Heatmap · Expense Tracker ·
Command Center Map · Anomaly Alerts · One-Tap Admin Actions ·
Driver Partner App · B2B Corporate App · Affiliate App

---

## SKILL FILES

```
SKILL.md                              ← Start here (build phases + principles)
references/
  01-monorepo-architecture.md         ← Melos, folder structure, shared packages
  02-design-system.md                 ← Tokens, components, dark mode, animations
  03-customer-app.md                  ← All customer features + screens
  04-to-07-apps.md                    ← Merchant, Rider, Admin, Standalone apps
  08-shared-systems.md                ← Auth, payments, real-time, maps, offline
  09-ci-cd-release.md                 ← GitHub Actions, Fastlane, Play/App Store
assets/
  pubspec-and-tests.md                ← All dependencies + 12 test prompts
  templates/pubspec-templates.yaml    ← Ready-to-copy pubspec.yaml per app
```

---

## QUICK START (for AI code builders)

1. Install this skill in your AI code builder
2. Create a new Flutter project directory: `chopfast_flutter/`
3. Start with: *"Using the chopfast-flutter-apps skill, set up the monorepo
   with Melos and create the chopfast_ui and chopfast_models packages"*
4. Follow the build phases in SKILL.md in order
5. Use the 12 test prompts in assets/pubspec-and-tests.md to validate each phase

---

## KEY TECHNOLOGY DECISIONS

| Decision | Choice | Why |
|---|---|---|
| Framework | Flutter 3.x + Dart 3 | Best performance for 7-app food delivery suite |
| State | Riverpod + Code Gen | Type-safe, testable, no boilerplate |
| Navigation | GoRouter | Deep links, type-safe, nested routing |
| Network | Dio + Retrofit | Interceptors for auth/retry, code-gen endpoints |
| Payments | flutter_paystack | Official Paystack Flutter partner SDK |
| Maps | google_maps_flutter | First-party, best performance |
| Real-time | socket_io_client | Matches existing Socket.io backend |
| Storage | Hive + flutter_secure_storage | Fast offline cache + encrypted tokens |
| Auth | Riverpod + local_auth | Biometrics + JWT refresh flow |
| CI/CD | GitHub Actions + Fastlane | Industry standard, well-documented |
| Crash reporting | Sentry | Best Flutter support, session replay |
| OTA updates | Shorebird | Instant hotfix without store review |

---

## NIGERIAN-SPECIFIC IMPLEMENTATIONS

- ₦ Currency: `NumberFormat.currency(locale: 'en_NG', symbol: '₦', decimalDigits: 0)`
- Phone validation: `/^(\+234|0)[789][01]\d{8}$/` with auto +234 normalization
- Address: Google Places autocomplete filtered to `components=country:ng`
- Maps: Biased to Nigerian cities (Lagos/Abuja default)
- SMS: Termii API for all OTP delivery
- Payments: Paystack (NGN only) with all Nigerian channels
- Banks: Full CBN bank list with NUBAN validation
- Dark patterns: Lagos traffic-aware ETA display
- Language: Nigerian English microcopy throughout

---

## IMPORTANT NOTES FOR AI BUILDERS

1. **Never hardcode colors** — always use ChopFastColors.* or theme tokens
2. **Never hardcode strings** — all user-facing text should support i18n
3. **All money displays use NairaText widget** — never raw Text() for ₦ amounts
4. **All images use CachedNetworkImage** — never Image.network() directly
5. **All lists have shimmer loading** — never show empty screens while loading
6. **All forms validate Nigerian context** — phone, address, bank account
7. **commission = food subtotal × merchant.commissionRate** — never on delivery/VAT
8. **Biometric required for** — withdrawal confirm, KDS exit, admin actions
9. **Socket.io namespace per app** — /customer, /merchant, /rider, /admin
10. **Never trust frontend payment** — always verify server-side via /payments/verify
