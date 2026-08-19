import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

final prayerSettingsRepositoryProvider = Provider<PrayerSettingsRepository>((ref) {
  return PrayerSettingsRepository(
    ref.watch(communityAdminRepositoryProvider),
  );
});

final iqomahDelayMinutesProvider = FutureProvider<int>((ref) {
  return ref.watch(prayerSettingsRepositoryProvider).loadIqomahDelayMinutes();
});

class PrayerSettingsRepository {
  PrayerSettingsRepository(
    this._communityRepository, {
    SharedPreferencesAsync? preferences,
  }) : _preferences = preferences ?? SharedPreferencesAsync();

  static const defaultIqomahDelayMinutes = 10;
  static const _cacheKey = 'prayer_iqomah_delay_minutes';

  final CommunityAdminRepository _communityRepository;
  final SharedPreferencesAsync _preferences;

  Future<int> loadIqomahDelayMinutes() async {
    try {
      final community = await _communityRepository.getCurrentCommunity();
      final delay = _validDelay(community.iqomahDelayMinutes);
      await _preferences.setInt(_cacheKey, delay);
      return delay;
    } catch (_) {
      return cachedIqomahDelayMinutes();
    }
  }

  Future<int> cachedIqomahDelayMinutes() async {
    final cached = await _preferences.getInt(_cacheKey);
    return cached == null ? defaultIqomahDelayMinutes : _validDelay(cached);
  }

  int _validDelay(int value) {
    return value >= 1 && value <= 60 ? value : defaultIqomahDelayMinutes;
  }
}
