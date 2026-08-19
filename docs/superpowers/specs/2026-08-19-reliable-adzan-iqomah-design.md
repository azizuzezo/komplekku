# Reliable Automatic Adzan and Iqomah Countdown

Date: 2026-08-19

Status: Approved direction; implementation pending final owner review

Scope: Android Flutter client, shared API/contracts, and Web/Flutter community administration

## Objective

Make automatic adzan audibly reliable when the Flutter app is foregrounded, backgrounded, or not running; show a live countdown from adzan time to iqomah; and allow authorized community administrators to change one global iqomah delay that applies to every prayer.

The default iqomah delay is 10 minutes. The server value is authoritative for the community. A device uses its last cached value while offline and falls back to 10 minutes only when it has never fetched a value.

## Confirmed Current Defects

1. Android alarms, permissions, channels, and packaged sound resources can all be present while the app still delegates the full adzan to notification-channel sound behavior. That does not give the app ownership of playback duration or lifecycle across OEM implementations.
2. `getAdzanState()` models post-adzan phases but `ShalatScreen` never consumes it, so no iqomah countdown can render.
3. The current scheduler posts iqomah at adzan plus 5 minutes, while the dormant UI state reaches zero at adzan plus 11 minutes. The two clocks disagree.
4. Scheduling success is inferred from accepted pending notifications. There is no durable playback health/status surfaced to the resident.

## Product Behavior

### Resident

- Before a prayer, Beranda and Shalat continue showing the countdown to the next adzan.
- At the exact prayer time, Android starts the bundled adzan through a foreground media playback service and displays an ongoing notification.
- The notification identifies the active prayer and includes `Hentikan Adzan`.
- From the adzan timestamp until iqomah, Shalat shows a prominent soft-purple card containing:
  - `Menuju Iqomah <Nama Shalat>`;
  - an `MM:SS` countdown using tabular figures;
  - the exact iqomah clock time;
  - a progress indicator whose end is the same timestamp used by the iqomah alarm.
- At countdown zero, Android plays the bundled iqomah sound once and the UI transitions out of countdown state.
- If notification or exact-alarm access is unavailable, Shalat shows a persistent actionable status instead of only a transient snackbar.

### Administrator

- Users with `community.manage` see an `Pengaturan Shalat` section in both Web and Flutter community administration.
- The section contains one integer field, `Jeda iqomah`, expressed in minutes.
- Valid values are 1 through 60 minutes; the default is 10.
- Saving updates the community value, records the existing community-update audit trail, refreshes the client cache, and immediately reschedules future prayer alarms on that device.
- The value applies equally to Subuh, Dzuhur, Ashar, Maghrib, and Isya. Syuruq remains excluded.

## Data and API Design

Add `iqomahDelayMinutes Int @default(10) @map("iqomah_delay_minutes")` to `Community` through a forward-only Prisma migration.

Extend the existing community contracts rather than create a parallel settings API:

- Current-community responses include `iqomahDelayMinutes`.
- `PATCH /api/v1/admin/community` accepts optional `iqomahDelayMinutes` validated as an integer from 1 to 60.
- Existing `community.manage` authorization and community scoping remain unchanged.
- In-memory and Prisma repositories implement the same field and audit behavior.

This keeps identity and prayer configuration in the established community settings flow while avoiding a new endpoint and permission.

## Flutter Data Flow

Introduce a small prayer configuration repository/provider that reads `iqomahDelayMinutes` from the authenticated current-community response, writes the last valid value to `SharedPreferencesAsync`, and exposes 10 minutes when neither network nor cache has a value.

`MainShell` passes the resolved duration into prayer rescheduling. The scheduler must not fetch HTTP data itself. This preserves the existing UI/data/service boundaries and keeps native scheduling deterministic.

When an administrator changes the value in Flutter, the community provider and prayer configuration provider are invalidated, then the scheduler cancels and recreates only future prayer events using the new duration.

## Android Playback Architecture

Replace notification-channel sound as the primary Android playback mechanism with native components under `apps/mobile/android/app/src/main/kotlin/id/komplekku/`:

1. `PrayerAlarmScheduler`
   - Receives a list of deterministic future events from Flutter through a `MethodChannel`.
   - Uses `AlarmManager` exact alarms when permitted and the existing inexact fallback when not.
   - Stores future event metadata in private Android preferences so reboot/package replacement can restore it.
   - Uses immutable/update-current `PendingIntent`s and deterministic IDs.

2. `PrayerAlarmReceiver`
   - Is not exported.
   - Accepts only the internal event kind (`adzan` or `iqomah`) and a known prayer label.
   - Starts `AdzanPlaybackService` with `ContextCompat.startForegroundService()`.

3. `AdzanPlaybackService`
   - Is not exported and declares `android:foregroundServiceType="mediaPlayback"`.
   - Immediately enters foreground state with a dedicated silent playback-status channel.
   - Plays only bundled `R.raw.adzan` or `R.raw.iqomah` through `MediaPlayer` using `USAGE_ALARM` audio attributes.
   - Holds audio focus and a partial wake lock only for playback duration.
   - Stops and releases all resources on completion, error, or `Hentikan Adzan`.
   - Handles a new prayer event idempotently so duplicate alarms cannot overlap audio.

4. `PrayerBootReceiver`
   - Is not exported.
   - Restores future alarms after boot or package replacement without starting media playback.

Manifest additions:

- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
- explicit `WAKE_LOCK`
- native receiver/service declarations

The existing notification-only adzan/iqomah channels are deleted during migration. iOS retains platform local-notification behavior because this native reliability correction is Android-specific.

## Shared Prayer Phase Model

Replace the disconnected 5-minute gap plus 6-minute countdown with one duration:

```text
adzanAt = prayer time
iqomahAt = adzanAt + configured delay (default 10 minutes)

now < adzanAt                  -> nextPrayer
adzanAt <= now < iqomahAt      -> iqomahCountdown
now >= iqomahAt                -> nextPrayer / prayer complete
```

The phase function is pure and receives `now`, calculated prayer times, and the configured duration. Both Home and Shalat consume the same result; Android receives the same `iqomahAt` epoch when alarms are scheduled.

## Failure Handling

- Notification permission denied: persistent Shalat warning with an action that opens/request notification access.
- Exact-alarm permission denied: show an `Alarm mungkin terlambat` status and use the inexact fallback; never claim exact scheduling.
- Native scheduling error: return structured error details through the method channel, preserve the last known schedule, and show a persistent retry action.
- Audio resource or playback error: stop the service safely, release focus/wake lock, record a diagnostic log, and leave a visible notification explaining that audio failed.
- API unavailable: use the cached delay; if absent, use 10 minutes and mark it as the default until sync succeeds.
- Invalid server value: reject it at the contract/API boundary; clients defensively clamp only cached legacy data.

## Testing Strategy

Use TDD in coherent layers:

1. Contracts/API
   - Default 10 is returned for existing communities.
   - Values 1 and 60 are accepted; 0, 61, fractions, and unauthorized updates are rejected.
   - Prisma and in-memory repositories return/update the same field and preserve community scoping.

2. Flutter unit/widget
   - Literal boundary fixtures prove countdown starts at adzan, shows `10:00`, reaches `00:01`, and exits exactly at +10:00.
   - Cached/server/default precedence is verified.
   - Shalat renders the iqomah card only during the active interval.
   - Admin saving a new value refreshes configuration and invokes rescheduling with that duration.
   - Permission/scheduling failures render persistent actions.

3. Android
   - JVM tests cover deterministic event IDs, input validation, stored-event restoration, and resource selection.
   - A release APK is installed on the emulator and a debug-only diagnostic method schedules an event roughly one minute ahead.
   - Verification captures AlarmManager registration, receiver invocation, foreground-service start, active `USAGE_ALARM` playback, notification stop action, service cleanup, and the matching Flutter countdown.
   - Reboot restoration and app-force-stop limitations are documented and tested where Android permits automation.

4. Finish gate
   - API and Web lint/type/tests/build.
   - Flutter analyze/full tests/release build.
   - `git diff --check` and focused obsolete-channel/dead-state searches.
   - Physical Android device validation remains required for OEM-specific battery/audio policy before production release.

## Rollout and Compatibility

- Migration default 10 preserves existing communities without a data backfill script.
- Existing route paths and account/community permissions do not change.
- Existing locally muted prayers remain muted; the new native scheduler consumes the same master/per-prayer preference.
- On first launch after upgrade, Flutter deletes old plugin-scheduled prayer notifications, provisions the native schedule, and reports success only after native confirmation.
- No deployment, publishing, or production data migration is part of the local implementation task.

## Acceptance Criteria

- A release APK produces audible adzan through the native foreground service at a diagnostic exact-alarm time while the app is foregrounded, backgrounded, and process-terminated (not force-stopped).
- `Hentikan Adzan` stops audio and releases service resources.
- Shalat displays an accurate countdown from `10:00` to zero using the same iqomah timestamp as Android.
- An authorized admin can set a global value from 1–60 minutes in Web and Flutter; all prayers use it after refresh/reschedule.
- Unauthorized users cannot update the value and do not see the admin control.
- Offline devices use the last cached value, otherwise 10 minutes.
- Missing permissions and scheduling/playback failures are visible and actionable.
