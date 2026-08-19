import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';
import 'dart:io';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late PrayerSchedulerService service;

  setUp(() {
    SharedPreferencesAsyncPlatform.instance =
        InMemorySharedPreferencesAsync.empty();
    service = PrayerSchedulerService(preferences: SharedPreferencesAsync());
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
}
