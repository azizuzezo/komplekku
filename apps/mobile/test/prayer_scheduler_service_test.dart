import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_local_notifications_platform_interface/flutter_local_notifications_platform_interface.dart';
import 'package:komplekku/features/prayer/data/prayer_alarm_bridge.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';
import 'dart:io';

const _localNotificationsChannel = MethodChannel(
  'dexterous.com/flutter/local_notifications',
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late PrayerSchedulerService service;

  setUp(() {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    SharedPreferencesAsyncPlatform.instance =
        InMemorySharedPreferencesAsync.empty();
    FlutterLocalNotificationsPlatform.instance =
        AndroidFlutterLocalNotificationsPlugin();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_localNotificationsChannel, (call) async {
      switch (call.method) {
        case 'initialize':
          return true;
        default:
          return null;
      }
    });
    service = PrayerSchedulerService(preferences: SharedPreferencesAsync());
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_localNotificationsChannel, null);
  });

  test('auto-adzan defaults to enabled', () async {
    expect(await service.isAutoAdzanEnabled(), isTrue);
  });

  test('muting persists and clears any pending schedule', () async {
    await service.setAutoAdzanEnabled(false);

    expect(await service.isAutoAdzanEnabled(), isFalse);
  });

  test('uses a drawable notification icon accepted by Android plugin', () {
    expect(PrayerSchedulerService.notificationIconName, 'ic_stat_komplekku');
    expect(
      File(
        'android/app/src/main/res/drawable/ic_stat_komplekku.xml',
      ).existsSync(),
      isTrue,
    );
    expect(
      File('android/app/src/main/AndroidManifest.xml').readAsStringSync(),
      contains('@drawable/ic_stat_komplekku'),
    );
    final keepRules = File(
      'android/app/src/main/res/raw/keep.xml',
    ).readAsStringSync();
    expect(keepRules, contains('@raw/adzan'));
    expect(keepRules, contains('@raw/iqomah'));
  });

  test('native events share one configured ten minute iqomah timestamp', () async {
    final bridge = _FakePrayerAlarmBridge();
    service = PrayerSchedulerService(
      preferences: SharedPreferencesAsync(),
      alarmBridge: bridge,
    );

    await service.rescheduleUpcomingPrayers(days: 2, iqomahDelayMinutes: 10);

    final adzanEvents = bridge.events.where((event) => event.kind == PrayerAlarmKind.adzan);
    expect(adzanEvents, isNotEmpty);
    for (final adzan in adzanEvents) {
      expect(
        bridge.events.any(
          (event) =>
              event.kind == PrayerAlarmKind.iqomah &&
              event.prayerLabel == adzan.prayerLabel &&
              event.epochMillis == adzan.epochMillis + const Duration(minutes: 10).inMilliseconds,
        ),
        isTrue,
      );
    }
  });
}

class _FakePrayerAlarmBridge extends PrayerAlarmBridge {
  List<PrayerAlarmEvent> events = const [];

  @override
  Future<PrayerAlarmStatus> replaceSchedule(List<PrayerAlarmEvent> events) async {
    this.events = events;
    return PrayerAlarmStatus(
      exactAlarmAllowed: true,
      scheduledCount: events.length,
    );
  }

  @override
  Future<void> cancelSchedule() async {
    events = const [];
  }
}
