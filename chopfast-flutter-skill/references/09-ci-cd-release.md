# Reference 09 — CI/CD & Release Pipeline

## Overview

Each of the 7 apps has its own GitHub Actions workflow. All workflows share
common job templates via reusable workflows. Fastlane handles signing,
building, and uploading. Sentry captures crash reports in production.

```
On Pull Request → analyze + test (all packages)
On merge to main → build staging APK/IPA + deploy to Firebase App Distribution
On Git tag (v*.*.*) → build production bundle + submit to Play Store / App Store
```

---

## Shared Reusable Workflow (.github/workflows/flutter-base.yml)

```yaml
name: Flutter Base CI

on:
  workflow_call:
    inputs:
      app_name:
        required: true
        type: string
      app_path:
        required: true
        type: string   # e.g. apps/customer
      package_id:
        required: true
        type: string   # e.g. ng.chopfast.customer
    secrets:
      KEYSTORE_BASE64:
        required: true
      KEY_ALIAS:
        required: true
      KEY_PASSWORD:
        required: true
      STORE_PASSWORD:
        required: true
      PLAY_STORE_JSON_KEY:
        required: true
      APP_STORE_CONNECT_API_KEY:
        required: true
      GOOGLE_SERVICES_JSON:
        required: true
      GOOGLE_SERVICE_INFO_PLIST:
        required: true
      SENTRY_DSN:
        required: true

jobs:
  # ── Analyze & Test ───────────────────────────────────────────
  analyze_test:
    name: Analyze & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.0'
          channel: 'stable'
          cache: true

      - name: Bootstrap Melos
        run: |
          dart pub global activate melos
          melos bootstrap

      - name: Analyze
        run: melos run analyze

      - name: Run tests
        run: |
          cd ${{ inputs.app_path }}
          flutter test --coverage --reporter=github

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ${{ inputs.app_path }}/coverage/lcov.info

  # ── Build Android ────────────────────────────────────────────
  build_android:
    name: Build Android
    runs-on: ubuntu-latest
    needs: analyze_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.0'
          channel: 'stable'
          cache: true

      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > ${{ inputs.app_path }}/android/keystore.jks

      - name: Write key.properties
        run: |
          cat > ${{ inputs.app_path }}/android/key.properties << EOF
          storePassword=${{ secrets.STORE_PASSWORD }}
          keyPassword=${{ secrets.KEY_PASSWORD }}
          keyAlias=${{ secrets.KEY_ALIAS }}
          storeFile=keystore.jks
          EOF

      - name: Write google-services.json
        run: |
          echo "${{ secrets.GOOGLE_SERVICES_JSON }}" | base64 -d \
            > ${{ inputs.app_path }}/android/app/google-services.json

      - name: Bootstrap Melos
        run: |
          dart pub global activate melos
          melos bootstrap

      - name: Build App Bundle (Production)
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          cd ${{ inputs.app_path }}
          flutter build appbundle \
            --flavor production \
            -t lib/main_production.dart \
            --dart-define=SENTRY_DSN=${{ secrets.SENTRY_DSN }} \
            --release

      - name: Build APK (Staging)
        if: github.ref == 'refs/heads/main'
        run: |
          cd ${{ inputs.app_path }}
          flutter build apk \
            --flavor staging \
            -t lib/main_staging.dart \
            --release

      - name: Upload to Firebase App Distribution (Staging)
        if: github.ref == 'refs/heads/main'
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ vars[format('{0}_FIREBASE_APP_ID', inputs.app_name)] }}
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          groups: internal-testers, merchants-beta
          file: ${{ inputs.app_path }}/build/app/outputs/flutter-apk/app-staging-release.apk

      - name: Upload to Play Store (Production)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_JSON_KEY }}
          packageName: ${{ inputs.package_id }}
          releaseFiles: ${{ inputs.app_path }}/build/app/outputs/bundle/productionRelease/*.aab
          track: internal      # internal → alpha → beta → production (manual promotion)
          status: completed
          whatsNewDirectory: ${{ inputs.app_path }}/distribution/whatsnew

  # ── Build iOS ────────────────────────────────────────────────
  build_ios:
    name: Build iOS
    runs-on: macos-14
    needs: analyze_test
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.0'
          channel: 'stable'
          cache: true

      - name: Write GoogleService-Info.plist
        run: |
          echo "${{ secrets.GOOGLE_SERVICE_INFO_PLIST }}" | base64 -d \
            > ${{ inputs.app_path }}/ios/Runner/GoogleService-Info.plist

      - name: Install CocoaPods
        run: |
          cd ${{ inputs.app_path }}/ios
          pod install --repo-update

      - name: Bootstrap Melos
        run: |
          dart pub global activate melos
          melos bootstrap

      - name: Build IPA (Production)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: yukiarrr/ios-build-action@v1.5.0
        with:
          project-path: ${{ inputs.app_path }}/ios/Runner.xcworkspace
          scheme: production
          configuration: Release-production
          export-method: app-store
          p12-base64: ${{ secrets.IOS_P12_BASE64 }}
          p12-password: ${{ secrets.IOS_P12_PASSWORD }}
          mobileprovision-base64: ${{ secrets.IOS_MOBILEPROVISION }}

      - name: Upload to TestFlight (Production)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: Apple-Actions/upload-testflight-build@v1
        with:
          app-path: ${{ inputs.app_path }}/output/Runner.ipa
          issuer-id: ${{ secrets.APP_STORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APP_STORE_KEY_ID }}
          api-private-key: ${{ secrets.APP_STORE_PRIVATE_KEY }}
```

---

## Customer App Workflow (.github/workflows/customer.yml)

```yaml
name: Customer App

on:
  push:
    branches: [main]
    paths: ['apps/customer/**', 'packages/**']
    tags: ['v*.*.*-customer']
  pull_request:
    paths: ['apps/customer/**', 'packages/**']

jobs:
  build:
    uses: ./.github/workflows/flutter-base.yml
    with:
      app_name: CUSTOMER
      app_path: apps/customer
      package_id: ng.chopfast.customer
    secrets: inherit
```

*Repeat pattern for merchant.yml, rider.yml, admin.yml, driver_partner.yml,
business.yml, affiliate.yml — each scoped to their app path and package ID.*

---

## Fastlane Setup (per app)

```ruby
# apps/customer/fastlane/Fastfile

default_platform(:android)

platform :android do
  desc "Deploy to Play Store Internal Track"
  lane :deploy_internal do
    gradle(
      task: 'bundle',
      build_type: 'Release',
      flavor: 'production',
      project_dir: 'android/',
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["STORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
      }
    )
    upload_to_play_store(
      track: 'internal',
      aab: 'build/app/outputs/bundle/productionRelease/app-production-release.aab',
      json_key_data: ENV["PLAY_STORE_JSON_KEY"],
    )
    slack(
      message: "✅ ChopFast Customer App deployed to Play Store Internal Track",
      channel: "#releases",
    )
  end
end

platform :ios do
  desc "Deploy to TestFlight"
  lane :deploy_testflight do
    build_app(
      workspace: "ios/Runner.xcworkspace",
      scheme: "production",
      configuration: "Release-production",
      export_method: "app-store",
    )
    upload_to_testflight(
      api_key_path: "fastlane/app_store_connect_api_key.json",
      skip_waiting_for_build_processing: true,
    )
    slack(
      message: "✅ ChopFast Customer App uploaded to TestFlight",
      channel: "#releases",
    )
  end
end
```

---

## App Version Management

```yaml
# Version strategy: major.minor.patch+buildNumber
# major: breaking changes (rare)
# minor: new features
# patch: bug fixes
# buildNumber: auto-incremented by CI (GitHub run number)

# pubspec.yaml version line:
version: 1.0.0+1   # managed by CI; do not edit manually

# CI auto-increments build number:
- name: Update version
  run: |
    VERSION=$(cat ${{ inputs.app_path }}/pubspec.yaml | grep 'version:' | sed 's/version: //' | cut -d'+' -f1)
    BUILD_NUMBER=${{ github.run_number }}
    sed -i "s/version: .*/version: ${VERSION}+${BUILD_NUMBER}/" ${{ inputs.app_path }}/pubspec.yaml
```

---

## Store Listings

### Play Store Listing (all 7 apps)

**Customer App (ng.chopfast.customer):**
```
Title: ChopFast — Nigerian Food Delivery
Short: Order jollof rice, suya, and more. Delivered fast.
Category: Food & Drink
Content Rating: Everyone
```

**Merchant App (ng.chopfast.merchant):**
```
Title: ChopFast Merchant — Manage Your Restaurant
Short: Accept orders, manage your menu, and track earnings.
Category: Business
Content Rating: Everyone
Note: This app is for verified ChopFast merchant partners only.
```

**Rider App (ng.chopfast.rider):**
```
Title: ChopFast Rider — Delivery Partner App
Short: Accept deliveries, navigate, and track your earnings.
Category: Business
Note: This app is for registered ChopFast delivery partners only.
```

**Driver Partner App (ng.chopfast.driver):**
```
Title: ChopFast Fleet — Driver Partner Dashboard
Short: Manage your delivery fleet and track earnings.
Category: Business
```

**B2B App (ng.chopfast.business):**
```
Title: ChopFast Business — Corporate Meal Ordering
Short: Order meals for your team with spending controls.
Category: Business
```

**Affiliate App (ng.chopfast.affiliate):**
```
Title: ChopFast Affiliate — Earn by Referring
Short: Share your link. Track earnings. Get paid.
Category: Finance
```

---

## Sentry Integration (crash reporting)

```dart
// In each app's main_production.dart:
await SentryFlutter.init(
  (options) {
    options.dsn = AppConfig.sentryDsn;
    options.tracesSampleRate = 0.2;        // 20% of sessions traced
    options.profilesSampleRate = 0.1;      // 10% profiled
    options.environment = AppConfig.flavor.name;
    options.release = 'ng.chopfast.customer@${AppConfig.version}';
    options.attachScreenshot = true;       // Attach screenshot on crash
    options.attachViewHierarchy = true;
  },
  appRunner: () => runApp(
    const ProviderScope(child: ChopFastApp())
  ),
);
```

---

## OTA Updates (Critical Bug Fix Path)

For non-native changes (Dart code only), use Shorebird for instant OTA:

```yaml
# Install Shorebird CLI
# shorebird release android / shorebird release ios
# For patch (no App Store/Play Store review needed):
# shorebird patch android --release-version=1.0.0+42

# Shorebird workflow step (hotfix only):
- name: Shorebird Patch (Hotfix)
  if: github.event_name == 'workflow_dispatch' && inputs.is_hotfix == 'true'
  run: |
    shorebird patch android \
      --release-version=${{ inputs.target_version }} \
      --dry-run=false
```
