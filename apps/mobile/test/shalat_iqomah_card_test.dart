import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';
import 'package:komplekku/features/prayer/presentation/shalat_screen.dart';

void main() {
  Widget wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

  group('IqomahCountdownCard', () {
    testWidgets('shows 10:00 right at adzan time', (tester) async {
      final adzanAt = DateTime(2026, 8, 19, 15, 28);
      final iqomahAt = adzanAt.add(const Duration(minutes: 10));
      final state = AdzanState(
        kind: AdzanStateKind.iqomahCountdown,
        activePrayer: PrayerName.ashar,
        adzanTimeMs: adzanAt.millisecondsSinceEpoch,
        iqomahTimeMs: iqomahAt.millisecondsSinceEpoch,
        iqomahSecondsRemaining: 600,
      );

      await tester.pumpWidget(wrap(IqomahCountdownCard(state: state)));

      expect(find.text('Menuju Iqomah Ashar'), findsOneWidget);
      expect(find.text('10:00'), findsOneWidget);
      expect(find.textContaining('15:38'), findsOneWidget);
    });

    testWidgets('shows 00:01 one second before iqomah', (tester) async {
      final adzanAt = DateTime(2026, 8, 19, 15, 28);
      final iqomahAt = adzanAt.add(const Duration(minutes: 10));
      final state = AdzanState(
        kind: AdzanStateKind.iqomahCountdown,
        activePrayer: PrayerName.ashar,
        adzanTimeMs: adzanAt.millisecondsSinceEpoch,
        iqomahTimeMs: iqomahAt.millisecondsSinceEpoch,
        iqomahSecondsRemaining: 1,
      );

      await tester.pumpWidget(wrap(IqomahCountdownCard(state: state)));

      expect(find.text('00:01'), findsOneWidget);
    });

    testWidgets('names the active prayer for every schedulable prayer', (
      tester,
    ) async {
      final adzanAt = DateTime(2026, 8, 19, 4, 43);
      final iqomahAt = adzanAt.add(const Duration(minutes: 10));
      final state = AdzanState(
        kind: AdzanStateKind.iqomahCountdown,
        activePrayer: PrayerName.subuh,
        adzanTimeMs: adzanAt.millisecondsSinceEpoch,
        iqomahTimeMs: iqomahAt.millisecondsSinceEpoch,
        iqomahSecondsRemaining: 300,
      );

      await tester.pumpWidget(wrap(IqomahCountdownCard(state: state)));

      expect(find.text('Menuju Iqomah Subuh'), findsOneWidget);
      expect(find.text('05:00'), findsOneWidget);
    });
  });

  group('PrayerScheduleHealthBanner', () {
    testWidgets(
      'offers to open exact-alarm settings when the permission is denied',
      (tester) async {
        var openedSettings = false;
        var retried = false;

        await tester.pumpWidget(
          wrap(
            PrayerScheduleHealthBanner(
              exactAlarmAllowed: false,
              hasError: false,
              onOpenSettings: () => openedSettings = true,
              onRetry: () => retried = true,
            ),
          ),
        );

        expect(find.text('Buka Pengaturan'), findsOneWidget);
        expect(find.textContaining('Alarm mungkin terlambat'), findsOneWidget);

        await tester.tap(find.text('Buka Pengaturan'));
        await tester.pump();

        expect(openedSettings, isTrue);
        expect(retried, isFalse);
      },
    );

    testWidgets('offers a retry action when native scheduling failed', (
      tester,
    ) async {
      var openedSettings = false;
      var retried = false;

      await tester.pumpWidget(
        wrap(
          PrayerScheduleHealthBanner(
            exactAlarmAllowed: true,
            hasError: true,
            onOpenSettings: () => openedSettings = true,
            onRetry: () => retried = true,
          ),
        ),
      );

      expect(find.text('Coba Lagi'), findsOneWidget);
      expect(find.textContaining('gagal dijadwalkan'), findsOneWidget);

      await tester.tap(find.text('Coba Lagi'));
      await tester.pump();

      expect(retried, isTrue);
      expect(openedSettings, isFalse);
    });
  });
}
