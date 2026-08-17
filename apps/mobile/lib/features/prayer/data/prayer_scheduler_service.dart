import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import 'package:komplekku/features/prayer/data/prayer_service.dart';

final prayerSchedulerServiceProvider = Provider<PrayerSchedulerService>((ref) {
  return PrayerSchedulerService();
});

/// Schedules adzan/iqomah local notifications ahead of time so they fire on
/// their own via the OS alarm + notification-channel sound, instead of
/// depending on [PrayerCard] being open and the app in the foreground.
class PrayerSchedulerService {
  PrayerSchedulerService({
    FlutterLocalNotificationsPlugin? plugin,
    SharedPreferencesAsync? preferences,
  }) : _plugin = plugin ?? FlutterLocalNotificationsPlugin(),
       _preferences = preferences ?? SharedPreferencesAsync();

  final FlutterLocalNotificationsPlugin _plugin;
  final SharedPreferencesAsync _preferences;

  static const _adzanChannelId = 'komplekku_adzan_channel';
  static const _iqomahChannelId = 'komplekku_iqomah_channel';
  static const _scheduledIdsKey = 'prayer_scheduler_scheduled_ids';
  static const _autoAdzanEnabledKey = 'prayer_scheduler_auto_enabled';
  static const _scheduleDays = 3;

  // Mirrors the gap prayer_service.dart's getAdzanState() uses between the
  // adzan and the iqomah countdown — kept as one source of truth so the
  // scheduled iqomah notification and the live countdown banner never drift.
  static const postAdzanGap = Duration(minutes: 5);

  static const _adzanPrayers = [
    PrayerName.subuh,
    PrayerName.dzuhur,
    PrayerName.ashar,
    PrayerName.maghrib,
    PrayerName.isya,
  ];

  bool _timezoneReady = false;
  bool _channelsReady = false;

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
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _adzanChannelId,
        'Adzan',
        description: 'Suara adzan otomatis saat waktu sholat tiba.',
        importance: Importance.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound('adzan'),
      ),
    );
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _iqomahChannelId,
        'Iqomah',
        description: 'Pengingat iqomah setelah jeda adzan.',
        importance: Importance.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound('iqomah'),
      ),
    );
    _channelsReady = true;
  }

  /// Requests the runtime permissions scheduled notifications need on
  /// Android 13+ (POST_NOTIFICATIONS) and Android 12+ (exact alarms). Safe to
  /// call repeatedly; the plugin no-ops once granted.
  Future<void> requestPermissions() async {
    final androidPlugin = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.requestNotificationsPermission();
    await androidPlugin?.requestExactAlarmsPermission();
  }

  /// Whether the user has left auto-adzan on (default) or muted it via
  /// [PrayerCard]'s mute toggle.
  Future<bool> isAutoAdzanEnabled() async {
    return await _preferences.getBool(_autoAdzanEnabledKey) ?? true;
  }

  /// Persists the mute toggle and immediately applies it: scheduling the
  /// upcoming notifications when turned on, or cancelling every pending one
  /// when turned off. Without this, muting the card would only silence the
  /// manual-play buttons while the OS-scheduled notifications kept firing.
  Future<void> setAutoAdzanEnabled(bool enabled) async {
    await _preferences.setBool(_autoAdzanEnabledKey, enabled);
    if (enabled) {
      await rescheduleUpcomingPrayers();
    } else {
      for (final id in await _loadScheduledIds()) {
        await _plugin.cancel(id);
      }
      await _preferences.setStringList(_scheduledIdsKey, const []);
    }
  }

  /// Cancels every notification this service previously scheduled, then
  /// schedules the adzan + iqomah notifications for the next [days] days.
  /// Call on app start and app resume — prayer times shift daily, and this
  /// also re-covers any schedule gap left by the device being off for a
  /// while (there is no background task runner in this app to do it silently
  /// while closed). No-ops (after clearing any stale schedule) when the user
  /// has muted auto-adzan.
  Future<void> rescheduleUpcomingPrayers({int days = _scheduleDays}) async {
    await _ensureTimezone();
    await _ensureChannels();

    for (final id in await _loadScheduledIds()) {
      await _plugin.cancel(id);
    }

    if (!await isAutoAdzanEnabled()) {
      await _preferences.setStringList(_scheduledIdsKey, const []);
      return;
    }

    final now = DateTime.now();
    final scheduledIds = <int>[];

    for (var dayOffset = 0; dayOffset < days; dayOffset++) {
      final day = now.add(Duration(days: dayOffset));
      final times = calculatePrayerTimes(date: day);

      for (final prayer in _adzanPrayers) {
        final adzanTime = times[prayer]!;
        final label = prayerLabels[prayer];

        if (adzanTime.isAfter(now)) {
          final id = _notificationId(day, prayer, isIqomah: false);
          await _scheduleAt(
            id: id,
            time: adzanTime,
            channelId: _adzanChannelId,
            channelName: 'Adzan',
            soundName: 'adzan',
            title: 'Waktu $label Tiba',
            body: 'Adzan $label telah berkumandang.',
          );
          scheduledIds.add(id);
        }

        final iqomahTime = adzanTime.add(postAdzanGap);
        if (iqomahTime.isAfter(now)) {
          final id = _notificationId(day, prayer, isIqomah: true);
          await _scheduleAt(
            id: id,
            time: iqomahTime,
            channelId: _iqomahChannelId,
            channelName: 'Iqomah',
            soundName: 'iqomah',
            title: 'Iqomah $label',
            body: 'Waktunya sholat $label berjamaah.',
          );
          scheduledIds.add(id);
        }
      }
    }

    await _preferences.setStringList(
      _scheduledIdsKey,
      scheduledIds.map((id) => id.toString()).toList(),
    );
  }

  Future<void> _scheduleAt({
    required int id,
    required DateTime time,
    required String channelId,
    required String channelName,
    required String soundName,
    required String title,
    required String body,
  }) async {
    final details = NotificationDetails(
      android: AndroidNotificationDetails(
        channelId,
        channelName,
        importance: Importance.max,
        priority: Priority.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound(soundName),
        category: AndroidNotificationCategory.alarm,
      ),
      iOS: const DarwinNotificationDetails(),
    );

    await _plugin.zonedSchedule(
      id,
      title,
      body,
      tz.TZDateTime.from(time, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  /// Deterministic per (day, prayer, adzan/iqomah) id so a reschedule call
  /// cancels exactly the notifications it previously created, and distinct
  /// from the id space used elsewhere (e.g. PrayerCard's manual-play id 999).
  int _notificationId(DateTime day, PrayerName prayer, {required bool isIqomah}) {
    final dayKey = day.year * 10000 + day.month * 100 + day.day;
    final prayerIndex = _adzanPrayers.indexOf(prayer);
    return 10000000 + (dayKey % 100000) * 100 + prayerIndex * 2 + (isIqomah ? 1 : 0);
  }

  Future<List<int>> _loadScheduledIds() async {
    final stored = await _preferences.getStringList(_scheduledIdsKey);
    if (stored == null) return const [];
    return stored.map(int.parse).toList();
  }
}
