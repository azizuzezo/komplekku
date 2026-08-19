import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:komplekku/features/community_admin/domain/community_detail.dart';
import 'package:komplekku/features/prayer/data/prayer_settings_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';

void main() {
  setUp(() {
    SharedPreferencesAsyncPlatform.instance = InMemorySharedPreferencesAsync.empty();
  });

  test('caches a valid community delay', () async {
    final repository = PrayerSettingsRepository(
      _FakeCommunityRepository(delay: 12),
      preferences: SharedPreferencesAsync(),
    );

    expect(await repository.loadIqomahDelayMinutes(), 12);
    expect(await repository.cachedIqomahDelayMinutes(), 12);
  });

  test('uses default ten minutes when server and cache are unavailable', () async {
    final repository = PrayerSettingsRepository(
      _FakeCommunityRepository(error: StateError('offline')),
      preferences: SharedPreferencesAsync(),
    );

    expect(await repository.loadIqomahDelayMinutes(), 10);
  });
}

class _FakeCommunityRepository extends CommunityAdminRepository {
  _FakeCommunityRepository({this.delay, this.error}) : super(Dio());

  final int? delay;
  final Object? error;

  @override
  Future<CommunityDetail> getCurrentCommunity() async {
    if (error != null) throw error!;
    return CommunityDetail(
      id: 'community-id',
      name: 'Billabong',
      slug: 'billabong',
      timezone: 'Asia/Jakarta',
      address: null,
      rwLabel: 'RW 03',
      iqomahDelayMinutes: delay!,
    );
  }
}
