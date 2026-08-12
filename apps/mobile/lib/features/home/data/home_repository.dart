import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/auth/session_store.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/home/domain/home_snapshot.dart';
import 'package:shared_preferences/shared_preferences.dart';

final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  return HomeRepository(
    ref.watch(apiClientProvider),
    ref.watch(sessionStoreProvider),
  );
});

final homeSnapshotProvider = FutureProvider.autoDispose<HomeSnapshot>((ref) {
  return ref.watch(homeRepositoryProvider).load();
});

class HomeRepository {
  HomeRepository(
    this._client,
    this._sessionStore, {
    SharedPreferencesAsync? preferences,
  })
      : _preferences = preferences ?? SharedPreferencesAsync();

  static const _cacheKeyPrefix = 'komplekku_home_snapshot_v1';
  final Dio _client;
  final SessionStore _sessionStore;
  final SharedPreferencesAsync _preferences;

  Future<HomeSnapshot> load() async {
    final cacheKey = await _currentCacheKey();
    try {
      final response = await _client.get<Map<String, dynamic>>('/home');
      final payload = response.data;
      if (payload == null) throw ApiException.malformedResponse();

      final snapshot = HomeSnapshot.fromJson(payload);
      await _writeCache(cacheKey, payload);
      return snapshot;
    } on DioException catch (error) {
      final failure = ApiException.fromDio(error);
      if (failure.isNetworkError) {
        final cached = await _readCache(cacheKey);
        if (cached != null) return cached;
      }
      throw failure;
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<void> clearCache() async {
    final cacheKey = await _currentCacheKey();
    if (cacheKey == null) return;

    try {
      await _preferences.remove(cacheKey);
    } on Exception {
      throw const ApiException(
        'HOME_CACHE_CLEAR_FAILED',
        'Data beranda lokal belum dapat dihapus. Coba keluar lagi.',
      );
    }
  }

  Future<void> _writeCache(
    String? cacheKey,
    Map<String, dynamic> payload,
  ) async {
    if (cacheKey == null) return;

    try {
      await _preferences.setString(cacheKey, jsonEncode(payload));
    } on Exception {
      // A fresh server response remains usable when optional local caching fails.
    }
  }

  Future<HomeSnapshot?> _readCache(String? cacheKey) async {
    if (cacheKey == null) return null;

    try {
      final encoded = await _preferences.getString(cacheKey);
      if (encoded == null) return null;

      final decoded = jsonDecode(encoded);
      if (decoded is! Map<String, dynamic>) return null;
      return HomeSnapshot.fromJson(decoded, isCached: true);
    } on FormatException {
      await clearCache();
      return null;
    } on TypeError {
      await clearCache();
      return null;
    } on Exception {
      await clearCache();
      return null;
    }
  }

  Future<String?> _currentCacheKey() async {
    try {
      final userId = await _sessionStore.readUserId();
      if (userId == null || userId.isEmpty) return null;
      return '${_cacheKeyPrefix}_$userId';
    } on Exception {
      throw const ApiException(
        'LOCAL_STORAGE_UNAVAILABLE',
        'Data sesi lokal belum dapat dibaca. Tutup lalu buka kembali aplikasi.',
      );
    }
  }
}
