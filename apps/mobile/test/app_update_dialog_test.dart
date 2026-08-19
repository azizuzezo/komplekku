import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/update/app_update_dialog.dart';
import 'package:komplekku/core/update/app_update_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';

const _channel = MethodChannel('id.komplekku/app_update');

const _release = AppRelease(
  versionCode: 42,
  versionName: '1.2.0',
  apkUrl: 'https://example.com/komplekku.apk',
  releaseNotes: 'Perbaikan adzan otomatis.\nCountdown iqomah lebih akurat.',
  mandatory: false,
);

Widget _wrap(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      home: Scaffold(body: Center(child: ElevatedButton(onPressed: () {}, child: child))),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferencesAsyncPlatform.instance =
        InMemorySharedPreferencesAsync.empty();
    WidgetsBinding.instance.resetInternalState();
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_channel, null);
    // AppLifecycleState is global binding state that would otherwise leak
    // into the next test.
    WidgetsBinding.instance.resetInternalState();
  });

  testWidgets(
    'downloading through DownloadManager shows live progress and installs on success while foregrounded',
    (tester) async {
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      var queryCount = 0;
      String? installedPath;
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(_channel, (call) async {
        switch (call.method) {
          case 'enqueueDownload':
            return 7;
          case 'queryDownload':
            queryCount++;
            if (queryCount == 1) {
              return {
                'status': 'RUNNING',
                'bytesDownloaded': 50,
                'bytesTotal': 200,
              };
            }
            return {
              'status': 'SUCCESSFUL',
              'bytesDownloaded': 200,
              'bytesTotal': 200,
              'localPath': '/data/user/0/id.komplekku/files/komplekku-42.apk',
            };
          case 'installApk':
            installedPath = call.arguments['path'] as String?;
            return true;
          default:
            return null;
        }
      });

      await tester.pumpWidget(_wrap(const AppUpdateDialog(release: _release)));
      await tester.pump();

      await tester.tap(find.text('Perbarui sekarang'));
      await tester.pump();
      await tester.pump();

      expect(find.textContaining('Mengunduh 25%'), findsOneWidget);
      expect(
        find.textContaining('berlanjut walau layar mati'),
        findsOneWidget,
      );

      // Advance the polling timer so the next query reports SUCCESSFUL.
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pump();
      await tester.pump();

      expect(installedPath, '/data/user/0/id.komplekku/files/komplekku-42.apk');
    },
  );

  testWidgets(
    'a download finishing while backgrounded waits for resume instead of losing the install',
    (tester) async {
      // Android silently refuses to launch the package installer from a
      // background activity launch — this reproduces the real bug found on
      // an emulator: the screen was locked exactly when DownloadManager
      // finished, and the dialog closed itself without ever showing the
      // installer. `resetInternalState()` in setUp already leaves
      // `lifecycleState` at null, which reads as "not foregrounded" just as
      // well as `paused` without disabling the test binding's frame pumping.
      var queryCount = 0;
      String? installedPath;
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(_channel, (call) async {
        switch (call.method) {
          case 'enqueueDownload':
            return 7;
          case 'queryDownload':
            queryCount++;
            if (queryCount == 1) {
              return {
                'status': 'RUNNING',
                'bytesDownloaded': 50,
                'bytesTotal': 200,
              };
            }
            return {
              'status': 'SUCCESSFUL',
              'bytesDownloaded': 200,
              'bytesTotal': 200,
              'localPath': '/data/user/0/id.komplekku/files/komplekku-42.apk',
            };
          case 'installApk':
            installedPath = call.arguments['path'] as String?;
            return true;
          default:
            return null;
        }
      });

      await tester.pumpWidget(_wrap(const AppUpdateDialog(release: _release)));
      await tester.pump();
      await tester.tap(find.text('Perbarui sekarang'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pump();
      await tester.pump();

      // Still backgrounded: the installer must not have been launched, and
      // the dialog must not have silently closed itself.
      expect(installedPath, isNull);
      expect(find.text('Pasang sekarang'), findsOneWidget);
      expect(find.byType(AppUpdateDialog), findsOneWidget);

      // The resident unlocks the phone and returns to the app.
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pump();
      await tester.pump();

      expect(installedPath, '/data/user/0/id.komplekku/files/komplekku-42.apk');
    },
  );

  testWidgets('reopening the dialog resumes watching an already-enqueued download', (
    tester,
  ) async {
    final calls = <String>[];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(_channel, (call) async {
      calls.add(call.method);
      switch (call.method) {
        case 'queryDownload':
          return {
            'status': 'RUNNING',
            'bytesDownloaded': 100,
            'bytesTotal': 200,
          };
        default:
          return null;
      }
    });

    // Simulate a prior launch that already enqueued this exact release.
    final prefs = SharedPreferencesAsync();
    await prefs.setInt('app_update_pending_download_id', 9);
    await prefs.setInt(
      'app_update_pending_version_code',
      _release.versionCode,
    );

    await tester.pumpWidget(_wrap(const AppUpdateDialog(release: _release)));
    await tester.pump();
    await tester.pump();

    expect(calls, isNot(contains('enqueueDownload')));
    expect(find.textContaining('Mengunduh 50%'), findsOneWidget);
  });
}
