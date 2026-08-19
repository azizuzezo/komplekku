import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/update/app_update_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';

const _channel = MethodChannel('id.komplekku/app_update');

const _release = AppRelease(
  versionCode: 42,
  versionName: '1.2.0',
  apkUrl: 'https://example.com/komplekku.apk',
  releaseNotes: 'Perbaikan adzan otomatis.',
  mandatory: false,
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppUpdateService service;
  late List<MethodCall> calls;

  setUp(() {
    calls = [];
    SharedPreferencesAsyncPlatform.instance =
        InMemorySharedPreferencesAsync.empty();
    service = AppUpdateService(Dio(), preferences: SharedPreferencesAsync());
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_channel, null);
  });

  void mockChannel(Future<Object?> Function(MethodCall call) handler) {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_channel, (call) async {
      calls.add(call);
      return handler(call);
    });
  }

  test('enqueueDownload asks DownloadManager and caches the returned id', () async {
    mockChannel((call) async {
      expect(call.method, 'enqueueDownload');
      expect(call.arguments, {
        'url': _release.apkUrl,
        'fileName': 'komplekku-42.apk',
      });
      return 7;
    });

    final id = await service.enqueueDownload(_release);

    expect(id, 7);
    expect(await service.pendingDownloadId(_release), 7);
  });

  test('pendingDownloadId ignores a cached id from a different release', () async {
    mockChannel((call) async => 7);
    await service.enqueueDownload(_release);

    const otherRelease = AppRelease(
      versionCode: 99,
      versionName: '2.0.0',
      apkUrl: 'https://example.com/other.apk',
      releaseNotes: null,
      mandatory: false,
    );

    expect(await service.pendingDownloadId(otherRelease), isNull);
  });

  test('clearPendingDownload removes the cached id', () async {
    mockChannel((call) async => 7);
    await service.enqueueDownload(_release);
    await service.clearPendingDownload();

    expect(await service.pendingDownloadId(_release), isNull);
  });

  test('queryDownload parses a running DownloadManager status', () async {
    mockChannel(
      (call) async => {
        'status': 'RUNNING',
        'bytesDownloaded': 50,
        'bytesTotal': 200,
      },
    );

    final status = await service.queryDownload(7);

    expect(status.state, DownloadState.running);
    expect(status.progress, 0.25);
    expect(status.localPath, isNull);
  });

  test('queryDownload parses a successful DownloadManager status', () async {
    mockChannel(
      (call) async => {
        'status': 'SUCCESSFUL',
        'bytesDownloaded': 200,
        'bytesTotal': 200,
        'localPath': '/storage/emulated/0/Android/data/id.komplekku/files/komplekku-42.apk',
      },
    );

    final status = await service.queryDownload(7);

    expect(status.state, DownloadState.successful);
    expect(status.progress, 1.0);
    expect(status.localPath, isNotNull);
  });

  test('queryDownload treats an unrecognised status string as unknown', () async {
    mockChannel((call) async => {'status': 'NOT_FOUND'});

    final status = await service.queryDownload(7);

    expect(status.state, DownloadState.unknown);
  });
}
