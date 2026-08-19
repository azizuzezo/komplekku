import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/update/app_changelog_screen.dart';
import 'package:komplekku/core/update/app_update_service.dart';

void main() {
  testWidgets('renders each release-notes line as its own bullet point', (
    tester,
  ) async {
    const release = AppRelease(
      versionCode: 42,
      versionName: '1.2.0',
      apkUrl: 'https://example.com/komplekku.apk',
      releaseNotes: 'Perbaikan adzan otomatis.\nCountdown iqomah lebih akurat.',
      mandatory: false,
    );

    await tester.pumpWidget(
      const MaterialApp(home: AppChangelogScreen(release: release)),
    );

    expect(find.textContaining('1.2.0'), findsOneWidget);
    expect(find.text('Perbaikan adzan otomatis.'), findsOneWidget);
    expect(find.text('Countdown iqomah lebih akurat.'), findsOneWidget);
    expect(find.text('Pembaruan wajib'), findsNothing);
  });

  testWidgets('shows a mandatory badge and a fallback message with no notes', (
    tester,
  ) async {
    const release = AppRelease(
      versionCode: 43,
      versionName: null,
      apkUrl: 'https://example.com/komplekku.apk',
      releaseNotes: null,
      mandatory: true,
    );

    await tester.pumpWidget(
      const MaterialApp(home: AppChangelogScreen(release: release)),
    );

    expect(find.text('Pembaruan wajib'), findsOneWidget);
    expect(
      find.text('Belum ada catatan perubahan rinci untuk versi ini.'),
      findsOneWidget,
    );
  });
}
