import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';

final appUpdateServiceProvider = Provider<AppUpdateService>((ref) {
  return AppUpdateService(ref.watch(apiClientProvider));
});

/// A newer build the API is offering.
class AppRelease {
  const AppRelease({
    required this.versionCode,
    required this.versionName,
    required this.apkUrl,
    required this.releaseNotes,
    required this.mandatory,
  });

  final int versionCode;
  final String? versionName;
  final String apkUrl;
  final String? releaseNotes;

  /// When true the prompt should not offer "Nanti".
  final bool mandatory;
}

/// Checks for, downloads, and hands off a newer APK to the system installer.
///
/// Android never allows a normal app to install silently — only a device-owner
/// or system app can. The best achievable is: download in the background, then
/// one confirmation tap on the OS installer screen. Everything here is built
/// around that, and around the fact that an update whose signature differs from
/// the installed build is rejected outright (see android/key.properties).
class AppUpdateService {
  AppUpdateService(this._client);

  final Dio _client;

  static const _channel = MethodChannel('id.komplekku/app_update');

  /// The `versionCode` of the running build, read from the platform rather
  /// than from pubspec — the OS value is the one Android itself compares.
  Future<int?> currentVersionCode() async {
    if (!_isAndroid) return null;
    try {
      final code = await _channel.invokeMethod<int>('currentVersionCode');
      return code;
    } on PlatformException {
      return null;
    }
  }

  /// Returns the newer release, or null when the app is already current, the
  /// server has no APK configured, or the check simply fails — an unreachable
  /// update check must never block using the app.
  Future<AppRelease?> checkForUpdate() async {
    if (!_isAndroid) return null;
    final versionCode = await currentVersionCode();
    if (versionCode == null) return null;

    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/app/latest-release',
        queryParameters: {'versionCode': versionCode},
      );
      final release = response.data?['data']?['release'];
      if (release is! Map<String, dynamic>) return null;
      if (release['available'] != true) return null;

      final latestCode = (release['versionCode'] as num?)?.toInt();
      final apkUrl = release['apkUrl'] as String?;
      if (latestCode == null || apkUrl == null) return null;
      // Belt and braces: never offer a "newer" build that is not actually
      // newer, whatever the server said.
      if (latestCode <= versionCode) return null;

      return AppRelease(
        versionCode: latestCode,
        versionName: release['versionName'] as String?,
        apkUrl: apkUrl,
        releaseNotes: release['releaseNotes'] as String?,
        mandatory: release['mandatory'] as bool? ?? false,
      );
    } catch (_) {
      return null;
    }
  }

  /// Downloads the APK, reporting progress as a 0–1 fraction, and returns the
  /// file path. Downloads into app-private storage, so no storage permission
  /// is needed and the OS cleans up on uninstall.
  Future<String> downloadApk(
    AppRelease release, {
    void Function(double progress)? onProgress,
  }) async {
    final directory = await _channel.invokeMethod<String>('downloadDirectory');
    if (directory == null) {
      throw const AppUpdateException('Lokasi unduhan tidak tersedia.');
    }
    final path = '$directory/komplekku-${release.versionCode}.apk';

    // A partial file from an interrupted attempt would install as a corrupt
    // package, so any leftover is discarded before starting.
    final file = File(path);
    if (await file.exists()) await file.delete();

    try {
      await _client.download(
        release.apkUrl,
        path,
        options: Options(
          // The APK is hosted outside the API, so none of the client's auth
          // headers or base URL apply.
          headers: const <String, dynamic>{},
          responseType: ResponseType.bytes,
          followRedirects: true,
        ),
        onReceiveProgress: (received, total) {
          if (total > 0) onProgress?.call(received / total);
        },
      );
    } on DioException catch (error) {
      throw AppUpdateException(
        error.type == DioExceptionType.connectionError
            ? 'Tidak dapat mengunduh pembaruan. Periksa koneksi.'
            : 'Pembaruan gagal diunduh.',
      );
    }

    return path;
  }

  /// Opens the system installer for the downloaded file. The user still taps
  /// "Install" on Android's own screen — this cannot be bypassed.
  Future<void> installApk(String path) async {
    try {
      await _channel.invokeMethod<bool>('installApk', {'path': path});
    } on PlatformException catch (error) {
      throw AppUpdateException(
        error.code == 'FILE_MISSING'
            ? 'Berkas pembaruan tidak ditemukan.'
            : 'Pemasangan pembaruan tidak dapat dibuka.',
      );
    }
  }

  bool get _isAndroid =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
}

class AppUpdateException implements Exception {
  const AppUpdateException(this.message);

  final String message;

  @override
  String toString() => message;
}
