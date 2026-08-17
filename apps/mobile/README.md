# Komplekku Mobile

Native Flutter client for the resident entry slice: phone number, six-digit OTP, secure bearer session, account-state routing, residency onboarding, approval status, and an actionable home snapshot backed by the same local API as the web app.

## Current boundary

The Dart source and tests are present, but the Flutter and Dart SDKs are not installed on this workstation. Consequently:

- `android/`, `ios/`, and other generated platform folders are intentionally absent.
- `flutter create`, dependency resolution, static analysis, tests, builds, and emulator runs have **not** been executed.
- This source has received a static compile-focused review only.
- The owner-provided Komplekku lockup/mark and the local OFL-licensed Plus Jakarta Sans variable font are bundled and declared in `pubspec.yaml`.
- Account onboarding is implemented against the current resident API boundary. The API does not yet expose an own-request detail endpoint or active-household context selector, so the app does not invent either feature.

Do not treat the mobile target as runtime-verified until the commands below pass with a supported Flutter SDK.

## Architecture

Code is feature-first and keeps presentation, domain models, and data access separate:

```text
lib/
  app/                  App, router, and theme
  core/                 API, secure session, and resident-safe errors
  features/auth/        OTP, typed session bootstrap, and account-state routing
  features/onboarding/  Community choice, manual house request, and status UI
  features/home/        Home API, offline snapshot, and native UI
```

The access token and verified user ID are stored with `flutter_secure_storage`. The last successful basic home response is stored under a per-user `shared_preferences` key for a labeled offline fallback and is cleared before logout. No development OTP or other secret is stored in source.

## Install Flutter and generate platform folders

Install a Flutter release compatible with `pubspec.yaml`, then verify the toolchain:

```powershell
flutter --version
flutter doctor
```

From `apps/mobile`, generate the native wrappers required to build and run the app:

```powershell
flutter create --org id.komplekku --project-name komplekku .
flutter pub get
flutter analyze
flutter test
flutter devices
```

Run generation from a clean worktree and review its diff so generated defaults do not replace intentional Komplekku source or configuration. Building iOS still requires macOS and Xcode.

Before treating the Android wrapper as complete, configure backup exclusions for `flutter_secure_storage` (or disable application backup when appropriate) so an encrypted value is never restored without its device key.

## Local API addresses

`API_BASE_URL` accepts either the API origin or the complete `/api/v1` base. The client normalizes both forms.

### Android Emulator

The default is already the Android emulator bridge to the development computer:

```text
http://10.0.2.2:3001/api/v1
```

Run with the PRD-style origin explicitly if preferred:

```powershell
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

`localhost` inside the Android emulator points to the emulator itself, so do not use `http://localhost:3001` there.

### Physical device on the same LAN

Use the development computer's private LAN address, for example:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3001
```

For this local-only workflow, the API must listen on a LAN interface (for example `HOST=0.0.0.0`), the phone and computer must be on the same trusted network, and the computer firewall must allow the local API port. Never expose this development API directly to the internet.

## Forum Warga image uploads

Forum message attachments upload directly to Cloudinary, the same unsigned-upload flow as `apps/web/lib/cloudinary-upload.ts`. Configure it with the same values as the web `.env.local`:

```powershell
flutter run --dart-define=CLOUDINARY_CLOUD_NAME=your-cloud-name --dart-define=CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
```

Without these defines, the image picker in Forum Warga surfaces a config error instead of silently failing.

## Local HTTP platform policy

The local API uses HTTP. After platform generation, configure local/debug wrappers to permit cleartext development traffic:

- Android: add a debug-only network security configuration or `android:usesCleartextTraffic="true"` in the debug manifest.
- iOS: add a narrowly scoped local-network App Transport Security exception for development; do not ship a blanket production exception.

Keep these allowances limited to local development. Production transport and hosting remain owner decisions and are not configured here.

## Expected resident flows

1. Start the local API and seeded database.
2. Open the app and enter a seeded resident phone number.
3. Enter the development OTP configured in the root environment.
4. The app maps the typed API `authState` to an allowlisted local route; the server's `nextPath` is never followed as an arbitrary route.
5. `NEEDS_RESIDENCY` loads registration communities from `GET /api/v1/onboarding/options`, then sends the resident's full name, relationship, and manually entered house code to `POST /api/v1/onboarding/residency-requests`. Houses are never enumerated to residents.
6. `PENDING_APPROVAL` opens the verification screen. Its explicit refresh action calls `GET /api/v1/me`; it does not show a fabricated ETA or request details unavailable from the API.
7. `READY` opens `/beranda`, which loads the tenant-scoped resident, community, house, and latest announcements from `GET /api/v1/home`.
8. `REJECTED`, `SUSPENDED`, `CONTEXT_REQUIRED`, and `ACCOUNT_CONFIGURATION_REQUIRED` open truthful account-status states. Rejected residents may resubmit because the API supports that transition. `CONTEXT_REQUIRED` does not show a selector because no list/select contract exists yet.
9. If the network later becomes unavailable, the last successful home snapshot is shown with an explicit offline notice. Server-required actions are never reported as successful offline.

On launch, a stored token is validated with `GET /api/v1/me`; token presence alone never grants a resident route. An expired session is removed locally and returns to login. Bootstrap, onboarding, pending, account-status, and home failure states provide real retry or logout actions.

## Verification gate after SDK installation

Do not call the mobile slice build-ready until all of these succeed:

```powershell
flutter pub get
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

Then manually verify OTP request, every auth-state redirect, new and rejected residency submission, pending-to-ready approval refresh, process restart with a stored session, offline fallback, expired-session logout, 360 px layout, large text, and long content on an emulator or physical device. The new Dart and widget tests are source-only until this SDK gate can actually run.
