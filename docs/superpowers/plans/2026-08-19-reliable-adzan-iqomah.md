# Reliable Adzan and Iqomah Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play adzan reliably at prayer time on Android, show one synchronized adzan-to-iqomah countdown, and let an authorized community admin configure the shared delay (default 10 minutes) from web or Flutter.

**Architecture:** Store `iqomahDelayMinutes` on `Community` and expose it through the existing community contracts. Flutter caches the server value and passes one timestamp model to both UI and scheduling. Android exact alarms start a foreground media-playback service instead of depending on notification-channel sound; the same native schedule persists for reboot restoration.

**Tech Stack:** Zod/TypeScript, Fastify, Prisma/PostgreSQL, Next.js/React Query/React Hook Form, Flutter/Riverpod, Android Kotlin `AlarmManager` + `MediaPlayer` + foreground service, Vitest, Flutter test, JUnit.

**Spec:** `docs/superpowers/specs/2026-08-19-reliable-adzan-iqomah-design.md`

## Global Constraints

- Keep work local; do not deploy, push, or provision infrastructure.
- Preserve the owner's existing Forum and Engineering journal changes.
- Use the shared brand tokens (`#4B2DA1`, `#32178F`, `#EEE9FF`) and existing responsive components.
- Only users with `community.manage` may change the delay; accepted range is 1–60 whole minutes.
- All five scheduled prayers use the same community delay, defaulting and falling back to 10 minutes.
- Exact alarm, playback, countdown, and iqomah reminder must derive from the same `adzanAt` and `iqomahAt` timestamps.

---

## Task 1: Community setting contract and persistence

**Files:**

- Modify: `packages/contracts/src/community.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260819090000_community_iqomah_delay/migration.sql`
- Modify: `apps/api/src/domain/repository.ts`
- Modify: `apps/api/src/repositories/prisma-repository.ts`
- Modify: `apps/api/src/testing/memory-repository.ts`
- Modify: `apps/api/tests/rt-rw-hierarchy.test.ts`
- Modify: `apps/api/tests/resident-announcement.test.ts`

- [x] Add failing contract/API assertions that current community returns `iqomahDelayMinutes: 10`, an authorized admin can update it, and values outside 1–60 are rejected.
- [x] Run focused API tests and confirm the new assertions fail.
- [x] Add `iqomahDelayMinutes: z.number().int().min(1).max(60)` to current/admin responses and the update input.
- [x] Add Prisma field `iqomahDelayMinutes Int @default(10) @map("iqomah_delay_minutes")` and a forward migration with the same default.
- [x] Thread the field through repository records, selects, update data, and in-memory fixtures.
- [x] Run contract typecheck and focused API tests; commit the coherent batch.

Representative contract:

```ts
export const iqomahDelayMinutesSchema = z.number().int().min(1).max(60);

export const updateCommunityInputSchema = z.object({
  // existing fields
  iqomahDelayMinutes: iqomahDelayMinutesSchema.optional(),
}).strict();
```

## Task 2: Admin controls on web and Flutter

**Files:**

- Modify: `apps/web/features/community/community-admin-panel.tsx`
- Modify/create: nearest existing community panel test under `apps/web`
- Modify: `apps/mobile/lib/features/community_admin/domain/community_detail.dart`
- Modify: `apps/mobile/lib/features/community_admin/data/community_admin_repository.dart`
- Modify: `apps/mobile/lib/features/community_admin/presentation/community_admin_screen.dart`
- Modify/create: `apps/mobile/test/community_admin_screen_test.dart`

- [x] Add failing web and Flutter tests for rendering 10 minutes, saving a valid integer, and blocking invalid input.
- [x] Add a dedicated “Jeda adzan ke iqomah” settings card; do not hide it inside profile identity fields.
- [x] Submit through the existing `PATCH /admin/community` mutation and invalidate/refetch current-community state.
- [x] Show concise save/error feedback and preserve the existing responsive card hierarchy.
- [x] Run focused web tests/typecheck and Flutter widget tests/analyze; commit the batch.

Representative payload:

```ts
await updateCommunity({ iqomahDelayMinutes: Number(values.iqomahDelayMinutes) });
```

```dart
await repository.updateCommunity(iqomahDelayMinutes: delayMinutes);
```

## Task 3: Shared Flutter setting and phase model

**Files:**

- Create: `apps/mobile/lib/features/prayer/data/prayer_settings_repository.dart`
- Modify: `apps/mobile/lib/features/prayer/data/prayer_service.dart`
- Create/modify: `apps/mobile/test/prayer_service_test.dart`
- Create: `apps/mobile/test/prayer_settings_repository_test.dart`

- [ ] Write failing pure tests for a direct 10-minute countdown, exact iqomah transition, idle state afterward, custom delay, and stale/offline fallback to cached 10 minutes.
- [ ] Replace the old 5-minute gap plus 6-minute countdown with one phase window:

```dart
final iqomahAt = adzanAt.add(Duration(minutes: iqomahDelayMinutes));
final secondsRemaining = max(0, iqomahAt.difference(now).inSeconds + 1);
```

- [ ] Fetch `/communities/current`, validate 1–60, cache the last valid value, and return 10 on a cold/offline fallback.
- [ ] Expose a Riverpod provider usable by both scheduler and UI.
- [ ] Run focused Dart tests and analyze; commit the batch.

## Task 4: Native Android exact-alarm playback pipeline

**Files:**

- Modify: `apps/mobile/android/app/src/main/AndroidManifest.xml`
- Modify: `apps/mobile/android/app/src/main/kotlin/id/komplekku/MainActivity.kt`
- Create: `apps/mobile/android/app/src/main/kotlin/id/komplekku/prayer/PrayerAlarmContract.kt`
- Create: `apps/mobile/android/app/src/main/kotlin/id/komplekku/prayer/PrayerAlarmScheduler.kt`
- Create: `apps/mobile/android/app/src/main/kotlin/id/komplekku/prayer/PrayerAlarmReceiver.kt`
- Create: `apps/mobile/android/app/src/main/kotlin/id/komplekku/prayer/AdzanPlaybackService.kt`
- Create: `apps/mobile/android/app/src/main/kotlin/id/komplekku/prayer/PrayerBootReceiver.kt`
- Modify: `apps/mobile/android/app/build.gradle.kts`
- Create: `apps/mobile/android/app/src/test/kotlin/id/komplekku/prayer/PrayerAlarmContractTest.kt`

- [ ] Add failing JVM tests for stable alarm IDs and event serialization/restoration.
- [ ] Declare `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, and `WAKE_LOCK`; register the service and non-exported alarm/boot receivers with `mediaPlayback` foreground type.
- [ ] Implement a MethodChannel `id.komplekku/prayer_alarm` with `replaceSchedule`, `cancelSchedule`, `status`, and debug-only `scheduleDiagnostic`.
- [ ] Schedule `RTC_WAKEUP` exact alarms with immutable/update-current PendingIntents, persisting the complete future event list before scheduling.
- [ ] On the adzan event, receiver starts `AdzanPlaybackService`; service creates a silent notification channel, posts a foreground notification with Stop action, holds a partial wake lock, plays `R.raw.adzan` using `USAGE_ALARM`, and stops/releases on completion or action.
- [ ] On iqomah event, use the same service pipeline with `R.raw.iqomah` and a short foreground notification.
- [ ] Restore future alarms on boot, time/timezone change, and package replacement; record last alarm/error status in SharedPreferences.
- [ ] Run Android unit tests and debug assembly; commit the batch.

Representative playback attributes:

```kotlin
setAudioAttributes(
    AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build()
)
```

## Task 5: Connect Flutter scheduler to native Android

**Files:**

- Create: `apps/mobile/lib/features/prayer/data/prayer_alarm_bridge.dart`
- Modify: `apps/mobile/lib/features/prayer/data/prayer_scheduler_service.dart`
- Modify: `apps/mobile/lib/app/shell/main_shell.dart`
- Modify: `apps/mobile/test/prayer_scheduler_service_test.dart`

- [ ] Add failing bridge/scheduler tests proving every enabled prayer generates an adzan event and an iqomah event at exactly `delayMinutes` later, and that mute/cancel reaches native Android.
- [ ] Keep notification permission handling, but on Android replace channel-sound `zonedSchedule` calls with one atomic native `replaceSchedule` call.
- [ ] Retain a platform-safe local-notification path only for iOS.
- [ ] Fetch the community delay before rescheduling; guard concurrent app-start/resume reschedules.
- [ ] Surface native status (`exactAlarmAllowed`, `scheduledCount`, `lastError`) to Riverpod without recursive scheduling.
- [ ] Run focused Flutter tests and analyze; commit the batch.

## Task 6: Visible countdown and health state

**Files:**

- Modify: `apps/mobile/lib/features/prayer/presentation/shalat_screen.dart`
- Modify: `apps/mobile/lib/features/home/presentation/prayer_summary_card.dart`
- Modify/create: relevant Flutter widget tests under `apps/mobile/test/`

- [ ] Add failing widget tests for the purple countdown card from 10:00 to 00:00, active prayer label, iqomah state, disabled permission warning, and schedule-error retry.
- [ ] Render one reusable phase card from `getAdzanState(now, times, iqomahDelayMinutes)` on Shalat and a compact matching state on Beranda.
- [ ] Show permission/schedule problems persistently with an action to open exact-alarm settings or retry; never depend on a transient snackbar alone.
- [ ] Use semantics labels and large touch targets; no overlapping floating action or bottom-navigation controls.
- [ ] Run widget tests, golden/focused screenshots if available, and analyze; commit the batch.

## Task 7: End-to-end verification and journal

- [ ] Run `corepack pnpm --filter @komplekku/contracts typecheck`.
- [ ] Run focused API tests plus `corepack pnpm --filter @komplekku/api typecheck`.
- [ ] Run focused web tests/typecheck/build.
- [ ] Run `flutter test` and `flutter analyze` from `apps/mobile`.
- [ ] Run Android unit tests and `assembleDebug`.
- [ ] Install the debug APK on an emulator/device, invoke the debug-only near-future diagnostic, and verify via logcat that the receiver starts the foreground service, audio begins, Stop works, and iqomah follows the configured short diagnostic interval.
- [ ] Reboot emulator, confirm future events restore, and verify the displayed countdown and native `iqomahAt` agree.
- [ ] Scan for `TODO`, placeholders, duplicate delay constants, and green brand leakage in changed UI.
- [ ] Append one consolidated WIB entry to `Engineering.md`, including commands/results and any physical-device limitation.
