import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import 'package:komplekku/features/prayer/data/prayer_service.dart';
import 'package:komplekku/features/prayer/data/prayer_alarm_bridge.dart';
import 'package:komplekku/features/prayer/data/prayer_settings_repository.dart';

final prayerSchedulerServiceProvider = Provider<PrayerSchedulerService>((ref) {
  return PrayerSchedulerService(
    settingsRepository: ref.watch(prayerSettingsRepositoryProvider),
  );
});

/// Native alarm health as of the last reschedule, so Shalat/Beranda can show a
/// persistent warning instead of relying on a transient snackbar. Updated by
/// whoever calls `rescheduleUpcomingPrayers` (see `MainShell`) — reading this
/// provider never triggers scheduling on its own.
class PrayerScheduleHealth {
  const PrayerScheduleHealth({
    this.exactAlarmAllowed = true,
    this.scheduledCount = 0,
    this.lastError,
  });

  final bool exactAlarmAllowed;
  final int scheduledCount;
  final String? lastError;
}

class PrayerScheduleHealthNotifier extends Notifier<PrayerScheduleHealth> {
  @override
  PrayerScheduleHealth build() => const PrayerScheduleHealth();

  void update(PrayerScheduleHealth health) => state = health;
}

final prayerScheduleHealthProvider =
    NotifierProvider<PrayerScheduleHealthNotifier, PrayerScheduleHealth>(
  PrayerScheduleHealthNotifier.new,
);

/// Schedules adzan/iqomah local notifications ahead of time so they fire on
/// their own via the OS alarm + notification-channel sound, whether the app is
/// in the foreground, backgrounded, or not running at all.
///
/// The notification channel is the *only* source of adzan sound. The app
/// deliberately does not also auto-play the audio in-process: a local
/// notification fires and sounds even while the app is open, so playing it
/// twice would double up. `PrayerCard`'s buttons stay as an on-demand replay.
class PrayerSchedulerService {
  PrayerSchedulerService({
    FlutterLocalNotificationsPlugin? plugin,
    SharedPreferencesAsync? preferences,
    PrayerAlarmBridge? alarmBridge,
    PrayerSettingsRepository? settingsRepository,
  }) : _plugin = plugin ?? FlutterLocalNotificationsPlugin(),
       _preferences = preferences ?? SharedPreferencesAsync(),
       _alarmBridge = alarmBridge ?? PrayerAlarmBridge(),
       _settingsRepository = settingsRepository;

  final FlutterLocalNotificationsPlugin _plugin;
  final SharedPreferencesAsync _preferences;
  final PrayerAlarmBridge _alarmBridge;
  final PrayerSettingsRepository? _settingsRepository;

  // Channel configuration is frozen by Android once a channel exists, so
  // changing the sound or its audio usage means publishing a new id. These
  // `_v2` ids carry USAGE_ALARM (loud, plays through the ringer being
  // silenced); the `_v1` ids below are only kept around long enough to delete
  // them from devices upgrading from the earlier build.
  static const _adzanChannelId = 'komplekku_adzan_alarm_v2';
  static const _iqomahChannelId = 'komplekku_iqomah_alarm_v2';
  static const _legacyChannelIds = [
    'komplekku_adzan_channel',
    'komplekku_iqomah_channel',
    _adzanChannelId,
    _iqomahChannelId,
  ];

  /// flutter_local_notifications resolves small icons from `res/drawable`.
  /// A mipmap reference makes initialization fail with `invalid_icon`.
  static const notificationIconName = 'ic_stat_komplekku';
  static const _scheduledIdsKey = 'prayer_scheduler_scheduled_ids';
  static const _autoAdzanEnabledKey = 'prayer_scheduler_auto_enabled';
  // Stored as the *muted* set rather than the enabled one so that a prayer
  // added later (or a fresh install) defaults to sounding.
  static const _mutedPrayersKey = 'prayer_scheduler_muted_prayers';
  // A week of lead time, so the adzan keeps firing even if the app is not
  // opened for several days (nothing reschedules while it is closed). At
  // 5 prayers x 2 notifications this is 70 pending alarms, well inside
  // Android's 500-alarm ceiling.
  static const _scheduleDays = 7;

  // Mirrors the gap prayer_service.dart's getAdzanState() uses between the
  // adzan and the iqomah countdown — kept as one source of truth so the
  // scheduled iqomah notification and the live countdown banner never drift.
  static const _adzanPrayers = [
    PrayerName.subuh,
    PrayerName.dzuhur,
    PrayerName.ashar,
    PrayerName.maghrib,
    PrayerName.isya,
  ];

  bool _pluginReady = false;
  bool _timezoneReady = false;
  bool _channelsReady = false;
  bool _exactAlarmPromptShown = false;

  int _scheduledNotificationCount = 0;
  String? _lastScheduleError;
  bool _exactAlarmAllowed = true;

  int get scheduledNotificationCount => _scheduledNotificationCount;
  String? get lastScheduleError => _lastScheduleError;
  bool get exactAlarmAllowed => _exactAlarmAllowed;

  /// Opens the system screen for granting the exact-alarm permission. Only
  /// meaningful on Android 12+; a no-op elsewhere.
  Future<void> openExactAlarmSettings() => _alarmBridge.openExactAlarmSettings();

  /// The scheduled notification is posted by a broadcast receiver long after
  /// this Dart isolate is gone, so it reads the small icon from the value
  /// `initialize()` persists. Without this call that lookup returns null, the
  /// receiver builds a notification with an invalid icon, and Android drops it
  /// silently — which is exactly why the adzan never sounded on its own.
  ///
  /// `FlutterLocalNotificationsPlugin` is a singleton, and
  /// `PushNotificationService` initialises the same instance with the same
  /// android settings, so calling this from both places is harmless.
  Future<void> _ensureInitialized() async {
    if (_pluginReady) return;
    await _plugin.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings(notificationIconName),
        iOS: DarwinInitializationSettings(),
      ),
    );
    _pluginReady = true;
  }

  Future<void> _ensureTimezone() async {
    if (_timezoneReady) return;
    tz_data.initializeTimeZones();
    // Komplekku's only deployed community (Billabong Blok F) is in Jakarta,
    // matching prayer_service.dart's own hardcoded coordinates. A community
    // timezone field would need to be threaded through here for multi-region
    // deployments, which is out of scope for this fix.
    tz.setLocalLocation(tz.getLocation('Asia/Jakarta'));
    _timezoneReady = true;
  }

  Future<void> _ensureChannels() async {
    if (_channelsReady) return;
    final androidPlugin = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (androidPlugin == null) {
      _channelsReady = true;
      return;
    }

    for (final legacyId in _legacyChannelIds) {
      await androidPlugin.deleteNotificationChannel(legacyId);
    }

    _channelsReady = true;
  }

  /// Requests the runtime permissions scheduled notifications need on
  /// Android 13+ (POST_NOTIFICATIONS) and Android 12+ (exact alarms).
  ///
  /// `MainShell` calls this on every resume, so the exact-alarm request is
  /// fired at most once per process: when that permission is missing the
  /// plugin opens a system settings screen *every* time it is asked, and since
  /// leaving that screen resumes the app it would bounce the user straight
  /// back into it forever. Declining is not fatal — scheduling falls back to
  /// inexact alarms.
  Future<void> requestPermissions() async {
    await _ensureInitialized();
    final androidPlugin = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (androidPlugin == null) return;

    await androidPlugin.requestNotificationsPermission();

    if (_exactAlarmPromptShown) return;
    _exactAlarmPromptShown = true;
    try {
      await androidPlugin.requestExactAlarmsPermission();
    } catch (_) {
      // Another permission request was already in flight; the inexact-alarm
      // fallback in rescheduleUpcomingPrayers() covers the denied case anyway.
    }
  }

  /// The prayers that still notify. The master switch below can silence all of
  /// them at once; this is the per-prayer bell shown on the Shalat tab.
  static List<PrayerName> get schedulablePrayers => _adzanPrayers;

  /// Whether the user has left auto-adzan on (default) or muted everything via
  /// the master toggle.
  Future<bool> isAutoAdzanEnabled() async {
    return await _preferences.getBool(_autoAdzanEnabledKey) ?? true;
  }

  Future<Set<PrayerName>> mutedPrayers() async {
    final stored = await _preferences.getStringList(_mutedPrayersKey);
    if (stored == null) return const {};
    return stored
        .map(
          (name) =>
              _adzanPrayers.where((prayer) => prayer.name == name).firstOrNull,
        )
        .whereType<PrayerName>()
        .toSet();
  }

  Future<bool> isPrayerEnabled(PrayerName prayer) async {
    if (!await isAutoAdzanEnabled()) return false;
    return !(await mutedPrayers()).contains(prayer);
  }

  /// Silences (or restores) one prayer and reapplies the schedule immediately,
  /// so the bell on the Shalat tab is the truth rather than a stored intention.
  Future<void> setPrayerEnabled(PrayerName prayer, bool enabled) async {
    final muted = {...await mutedPrayers()};
    if (enabled) {
      muted.remove(prayer);
    } else {
      muted.add(prayer);
    }
    await _preferences.setStringList(
      _mutedPrayersKey,
      muted.map((item) => item.name).toList(),
    );
    await rescheduleUpcomingPrayers();
  }

  /// Persists the mute toggle and immediately applies it: scheduling the
  /// upcoming notifications when turned on, or cancelling every pending one
  /// when turned off.
  Future<void> setAutoAdzanEnabled(bool enabled) async {
    await _preferences.setBool(_autoAdzanEnabledKey, enabled);
    if (enabled) {
      await rescheduleUpcomingPrayers();
    } else {
      await _cancelScheduled();
    }
  }

  /// Cancels every notification this service previously scheduled, then
  /// schedules the adzan + iqomah notifications for the next [days] days.
  /// Call on app start and app resume — prayer times shift daily, and this
  /// also re-covers any schedule gap left by the device being off for a
  /// while. No-ops (after clearing any stale schedule) when the user has muted
  /// auto-adzan.
  Future<void> rescheduleUpcomingPrayers({
    int days = _scheduleDays,
    int? iqomahDelayMinutes,
  }) async {
    _scheduledNotificationCount = 0;
    _lastScheduleError = null;
    await _ensureInitialized();
    await _ensureTimezone();
    await _ensureChannels();
    await _cancelScheduled();

    if (!await isAutoAdzanEnabled()) return;

    final delayMinutes =
        iqomahDelayMinutes ??
        await _settingsRepository?.loadIqomahDelayMinutes() ??
        PrayerSettingsRepository.defaultIqomahDelayMinutes;
    final isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

    // Android 12+ can refuse exact alarms. Rather than let the first refusal
    // throw and abort the whole loop — leaving nothing scheduled at all — the
    // mode is resolved once up front and every prayer is scheduled with it.
    final muted = await mutedPrayers();
    final now = DateTime.now();
    final scheduledIds = <int>[];
    final nativeEvents = <PrayerAlarmEvent>[];

    for (var dayOffset = 0; dayOffset < days; dayOffset++) {
      final day = now.add(Duration(days: dayOffset));
      final times = calculatePrayerTimes(date: day);

      for (final prayer in _adzanPrayers) {
        if (muted.contains(prayer)) continue;
        final adzanTime = times[prayer]!;
        final label = prayerLabels[prayer];

        if (adzanTime.isAfter(now)) {
          final id = _notificationId(day, prayer, isIqomah: false);
          if (isAndroid) {
            nativeEvents.add(
              PrayerAlarmEvent(
                id: id,
                epochMillis: adzanTime.millisecondsSinceEpoch,
                kind: PrayerAlarmKind.adzan,
                prayerLabel: label!,
              ),
            );
          } else {
            final scheduled = await _scheduleAt(
              id: id,
              time: adzanTime,
              channelId: _adzanChannelId,
              channelName: 'Adzan',
              soundName: 'adzan',
              scheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
              title: 'Waktu $label Tiba',
              body: 'Adzan $label telah berkumandang.',
            );
            if (scheduled) scheduledIds.add(id);
          }
        }

        final iqomahTime = adzanTime.add(Duration(minutes: delayMinutes));
        if (iqomahTime.isAfter(now)) {
          final id = _notificationId(day, prayer, isIqomah: true);
          if (isAndroid) {
            nativeEvents.add(
              PrayerAlarmEvent(
                id: id,
                epochMillis: iqomahTime.millisecondsSinceEpoch,
                kind: PrayerAlarmKind.iqomah,
                prayerLabel: label!,
              ),
            );
          } else {
            final scheduled = await _scheduleAt(
              id: id,
              time: iqomahTime,
              channelId: _iqomahChannelId,
              channelName: 'Iqomah',
              soundName: 'iqomah',
              scheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
              title: 'Iqomah $label',
              body: 'Waktunya sholat $label berjamaah.',
            );
            if (scheduled) scheduledIds.add(id);
          }
        }
      }
    }

    if (isAndroid) {
      try {
        final status = await _alarmBridge.replaceSchedule(nativeEvents);
        _scheduledNotificationCount = status.scheduledCount;
        _lastScheduleError = status.lastError;
        _exactAlarmAllowed = status.exactAlarmAllowed;
      } catch (error, stackTrace) {
        _lastScheduleError = error.toString();
        debugPrint('Native prayer schedule failed: $error');
        debugPrintStack(stackTrace: stackTrace);
      }
    } else {
      await _preferences.setStringList(
        _scheduledIdsKey,
        scheduledIds.map((id) => id.toString()).toList(),
      );
      _scheduledNotificationCount = scheduledIds.length;
    }
  }

  Future<void> _cancelScheduled() async {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      try {
        await _alarmBridge.cancelSchedule();
      } catch (_) {
        // Native channel can be unavailable in unit tests before attachment.
      }
    }
    for (final id in await _loadScheduledIds()) {
      await _plugin.cancel(id);
    }
    await _preferences.setStringList(_scheduledIdsKey, const []);
  }

  /// Returns whether the notification was accepted, so a single rejected
  /// prayer cannot silently poison the stored id list.
  Future<bool> _scheduleAt({
    required int id,
    required DateTime time,
    required String channelId,
    required String channelName,
    required String soundName,
    required AndroidScheduleMode scheduleMode,
    required String title,
    required String body,
  }) async {
    final details = NotificationDetails(
      android: AndroidNotificationDetails(
        channelId,
        channelName,
        icon: notificationIconName,
        importance: Importance.max,
        priority: Priority.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound(soundName),
        audioAttributesUsage: AudioAttributesUsage.alarm,
        category: AndroidNotificationCategory.alarm,
        visibility: NotificationVisibility.public,
      ),
      iOS: const DarwinNotificationDetails(),
    );

    try {
      await _plugin.zonedSchedule(
        id,
        title,
        body,
        tz.TZDateTime.from(time, tz.local),
        details,
        androidScheduleMode: scheduleMode,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
      return true;
    } catch (error, stackTrace) {
      // A rejected alarm (revoked permission, OEM quota) must not stop the
      // remaining prayers from being scheduled.
      _lastScheduleError ??= error.toString();
      debugPrint('Prayer schedule failed for $title at $time: $error');
      debugPrintStack(stackTrace: stackTrace);
      return false;
    }
  }

  /// Deterministic per (day, prayer, adzan/iqomah) id so a reschedule call
  /// cancels exactly the notifications it previously created, and distinct
  /// from the id space used elsewhere (e.g. PushNotificationService's ids).
  int _notificationId(
    DateTime day,
    PrayerName prayer, {
    required bool isIqomah,
  }) {
    final dayKey = day.year * 10000 + day.month * 100 + day.day;
    final prayerIndex = _adzanPrayers.indexOf(prayer);
    return 10000000 +
        (dayKey % 100000) * 100 +
        prayerIndex * 2 +
        (isIqomah ? 1 : 0);
  }

  Future<List<int>> _loadScheduledIds() async {
    final stored = await _preferences.getStringList(_scheduledIdsKey);
    if (stored == null) return const [];
    return stored.map(int.tryParse).whereType<int>().toList();
  }
}
