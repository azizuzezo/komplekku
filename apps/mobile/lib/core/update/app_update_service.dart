import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

enum DownloadState { pending, running, paused, successful, failed, unknown }

/// A snapshot of a [DownloadManager] request, read straight from the OS so it
/// reflects reality even after the app process was killed and relaunched
/// mid-download.
class DownloadStatus {
  const DownloadStatus({
    required this.state,
    required this.bytesDownloaded,
    required this.bytesTotal,
    this.localPath,
  });

  factory DownloadStatus.fromMap(Map<Object?, Object?> map) {
    return DownloadStatus(
      state: _parseState(map['status'] as String?),
      bytesDownloaded: (map['bytesDownloaded'] as num?)?.toInt() ?? 0,
      bytesTotal: (map['bytesTotal'] as num?)?.toInt() ?? 0,
      localPath: map['localPath'] as String?,
    );
  }

  final DownloadState state;
  final int bytesDownloaded;
  final int bytesTotal;
  final String? localPath;

  /// Null while the total size is not known yet (DownloadManager reports it
  /// only after the response headers arrive).
  double? get progress => bytesTotal > 0 ? bytesDownloaded / bytesTotal : null;

  static DownloadState _parseState(String? value) {
    switch (value) {
      case 'PENDING':
        return DownloadState.pending;
      case 'RUNNING':
        return DownloadState.running;
      case 'PAUSED':
        return DownloadState.paused;
      case 'SUCCESSFUL':
        return DownloadState.successful;
      case 'FAILED':
        return DownloadState.failed;
      default:
        return DownloadState.unknown;
    }
  }
}

/// Checks for a newer release, downloads it through Android's own
/// [DownloadManager], and hands the result off to the system installer.
///
/// The download deliberately does not run inside the Dart isolate: a plain
/// in-process HTTP download is throttled or torn down when the screen locks
/// or the app is backgrounded, which is exactly the "download restarts when
/// the screen turns off" bug this replaces. [DownloadManager] is an Android
/// system service — once enqueued, it keeps running independently of both the
/// app process and the screen state, and the enqueued id is cached so a
/// relaunched app resumes watching the same download instead of starting a
/// new one.
///
/// Android never allows a normal app to install silently — only a
/// device-owner or system app can. The best achievable is: download in the
/// background, then one confirmation tap on the OS installer screen.
/// Everything here is built around that, and around the fact that an update
/// whose signature differs from the installed build is rejected outright (see
/// android/key.properties).
class AppUpdateService {
  AppUpdateService(this._client, {SharedPreferencesAsync? preferences})
    : _preferences = preferences ?? SharedPreferencesAsync();

  final Dio _client;
  final SharedPreferencesAsync _preferences;

  static const _channel = MethodChannel('id.komplekku/app_update');
  static const _pendingDownloadIdKey = 'app_update_pending_download_id';
  static const _pendingVersionCodeKey = 'app_update_pending_version_code';

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

  String fileNameFor(AppRelease release) => 'komplekku-${release.versionCode}.apk';

  /// A download already in flight (or finished) for [release], if the app
  /// enqueued one before being backgrounded or killed. Returns null when
  /// there is none, or when the cached id belongs to a different release.
  Future<int?> pendingDownloadId(AppRelease release) async {
    final versionCode = await _preferences.getInt(_pendingVersionCodeKey);
    if (versionCode != release.versionCode) return null;
    return _preferences.getInt(_pendingDownloadIdKey);
  }

  /// Hands the APK URL to [DownloadManager] and returns its request id.
  /// The request survives the app being backgrounded, screen-locked, or
  /// killed outright — it is the OS, not this process, doing the download.
  Future<int> enqueueDownload(AppRelease release) async {
    try {
      final id = await _channel.invokeMethod<int>('enqueueDownload', {
        'url': release.apkUrl,
        'fileName': fileNameFor(release),
      });
      if (id == null) {
        throw const AppUpdateException('Unduhan tidak dapat dimulai.');
      }
      await _preferences.setInt(_pendingDownloadIdKey, id);
      await _preferences.setInt(_pendingVersionCodeKey, release.versionCode);
      return id;
    } on PlatformException {
      throw const AppUpdateException('Unduhan tidak dapat dimulai.');
    }
  }

  /// Reads the current state of [downloadId] straight from the OS.
  Future<DownloadStatus> queryDownload(int downloadId) async {
    final result = await _channel.invokeMapMethod<Object?, Object?>(
      'queryDownload',
      {'id': downloadId},
    );
    return DownloadStatus.fromMap(result ?? const {});
  }

  /// Clears the cached download id once it has been installed or abandoned,
  /// so the next update check starts a fresh download rather than resuming.
  Future<void> clearPendingDownload() async {
    await _preferences.remove(_pendingDownloadIdKey);
    await _preferences.remove(_pendingVersionCodeKey);
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
