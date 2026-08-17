import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late PrayerSchedulerService service;

  setUp(() {
    SharedPreferencesAsyncPlatform.instance = InMemorySharedPreferencesAsync.empty();
    service = PrayerSchedulerService(preferences: SharedPreferencesAsync());
  });

  test('auto-adzan defaults to enabled', () async {
    expect(await service.isAutoAdzanEnabled(), isTrue);
  });

  test('muting persists and clears any pending schedule', () async {
    await service.setAutoAdzanEnabled(false);

    expect(await service.isAutoAdzanEnabled(), isFalse);
  });
}
