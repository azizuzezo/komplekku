# Mobile

The mobile client is native Flutter, not a WebView. It uses the same Fastify API as the web.

## Structure

```text
lib/
  app/                 app, router, theme
  core/                API, auth, errors, storage, shared widgets
  features/<feature>/
    data/
    domain/
    presentation/
```

The current source uses Riverpod controllers, `go_router`, Dio,
`flutter_secure_storage`, and `shared_preferences`, with transport/storage concerns behind
feature repositories. Package choices remain replaceable behind domain interfaces.

## Implemented resident flow

- Phone number and six-digit OTP with typed, allowlisted `authState` navigation.
- Secure session restore through `GET /me`, including loading, offline/error, expired-session,
  and logout behavior.
- Community selection followed by a manual house-code, full-name, and relationship request.
  Houses are never enumerated.
- Pending approval with manual status refresh, rejected re-submission, and truthful
  suspended/context/configuration states.
- A bottom-navigation shell (`StatefulShellRoute.indexedStack`, so each tab keeps its own
  navigation stack) with five destinations: Beranda, Keamanan, Layanan, Aktivitas, Akun.
  Keamanan and Layanan are permission-filtered grouped-menu screens (`HubMenuScreen`,
  `lib/core/widgets/hub_menu_screen.dart`) fanning out to the real feature screens below —
  a flat bottom nav cannot hold 15+ destinations the way the web sidebar's scrollable list
  can. Aktivitas groups Pengumuman/Agenda/Notifikasi as nested routes
  (`/aktivitas/pengumuman`, `/aktivitas/agenda`, `/aktivitas/notifikasi`).
- Active-resident home with a per-user offline snapshot, plus a link into the full
  announcement list.
- Announcement list and detail (auto-marks read on open), agenda list with an
  upcoming/past segmented toggle and detail, notification list with mark-one/mark-all-read
  and tap-to-open-linked-entity, and an account screen with the resident credential card and
  logout (moved off the home app bar into this screen).
- Full Phase 2-4 parity under Keamanan/Layanan: CCTV (mock/simulated feed), Tamu/visitor
  invite, Paket/package status, Darurat/emergency SOS, Kejadian/incident (dual resident+staff
  mode), Patroli/patrol checkpoint execution, Dashboard Keamanan (security ops summary),
  Lapor Masalah/report (dual mode), Surat/letter request (dual mode), Fasilitas/facility
  booking, Iuran/invoice+payment (dual mode), Transparansi Kas/cash ledger (dual mode),
  and Keuangan/finance dashboard. "Dual mode" means the same screen shows either the
  resident's own view or a staff manage view, gated on the account's `permissions` array
  (see `currentPermissionsProvider`, `lib/core/auth/permissions_provider.dart`) — mirroring
  how the web sidebar filters by permission, mobile now reads and uses that same array
  instead of discarding it.
- Patrol checkpoint "scanning" and visitor QR are intentionally simple: a manual text-token
  entry field and a plain-text token display, not a real camera/QR scanner or rendered
  barcode — matching the web app's own equivalents, no camera/QR package was added.

The API does not yet expose a multiple-context selector or resident own-request detail, so
the mobile client deliberately does not invent those screens or data. Facility/letter-type
catalog management and dues-type management remain seed-only on mobile too, matching the web
app, which also has no catalog-management UI for those.

## Toolchain (verified 2026-08-12)

Flutter 3.44.8 (stable) and OpenJDK 21 (bundled with Android Studio) are installed and
verified end-to-end on this machine: `flutter pub get`, `flutter analyze`, `flutter test`
(88 tests), and a debug APK build all pass, and the debug APK was installed and driven on a
local emulator (AVD `Keenan`) against the real local API, covering login, both new hub
screens, and a representative sample of the new feature screens.

- Flutter SDK: `C:\Users\aziz\develop\flutter` (add `bin` to `PATH`).
- JDK: `C:\Program Files\Android\Android Studio\jbr` (set as `JAVA_HOME`).
- Android SDK: `C:\Users\aziz\AppData\Local\Android\sdk`; command-line tools were installed
  under `cmdline-tools/latest` and all SDK licenses accepted.
- `apps/mobile/android` (the native Gradle/Kotlin project) is generated, not hand-written; it
  was created via `flutter create --org id.komplekku --project-name komplekku --platforms=android .`
  in this directory without touching the existing `lib/`, `test/`, or `pubspec.yaml`. Its
  `AndroidManifest.xml` declares `INTERNET` and `usesCleartextTraffic="true"` (the local API is
  plain HTTP), and `android/app/build.gradle.kts` pins `compileSdk = 37` because
  `flutter_secure_storage` requires it.
- Known local quirk: on this Windows/Android-36+ SDK combination, an auto-downloaded platform
  is named `android-37.0` rather than the `android-37` hash string Gradle looks up; a directory
  junction (`android-37` -> `android-37.0` under `sdk/platforms`) works around it. If SDK
  Platform 37 downloads again on a clean machine, recreate that junction if the build reports
  `Failed to find target with hash string 'android-37'`.
- Outputs: `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk` and `app-release.apk`.
  The release build still signs with the debug key (see the `TODO` in `build.gradle.kts`) —
  fine for local installs, not for a store listing.

## Local API

Android emulator:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/v1
```

Physical device: use `http://<development-computer-LAN-IP>:3001/api/v1` and bind the API to
the LAN deliberately. Do not broaden database, Redis, MinIO, or MediaMTX bindings at the same
time.

## UI

Use native Flutter widgets, Material icons, the Komplekku token values, and nested navigation
where tab state needs to be retained. The owner-supplied lockup, compact application mark,
and local Plus Jakarta Sans variable font are declared under `apps/mobile/assets`. The
five-item bottom nav (Beranda, Keamanan, Layanan, Aktivitas, Akun) is implemented; within the
Keamanan/Layanan hub screens, hide unfinished destinations or show an explicit disabled
reason rather than a dead control.

Respect platform reduced-motion settings. Store opaque session tokens only in secure storage.
The Dart source includes focused auth-state, router-guard, repository/error, truth-copy, and
360 px widget tests. The Flutter SDK is still required to resolve packages and execute
format/analyze/test/build/emulator verification; do not claim those checks passed while the
executables are unavailable.
