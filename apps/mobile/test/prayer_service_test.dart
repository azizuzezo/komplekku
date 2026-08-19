import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';

void main() {
  final adzanAt = DateTime(2026, 8, 19, 15, 28);
  final times = <PrayerName, DateTime>{
    PrayerName.subuh: DateTime(2026, 8, 19, 4, 43),
    PrayerName.syuruq: DateTime(2026, 8, 19, 6),
    PrayerName.dzuhur: DateTime(2026, 8, 19, 12, 4),
    PrayerName.ashar: adzanAt,
    PrayerName.maghrib: DateTime(2026, 8, 19, 18, 2),
    PrayerName.isya: DateTime(2026, 8, 19, 19, 17),
  };

  test('countdown starts immediately at adzan and ends at configured iqomah', () {
    final atAdzan = getAdzanState(adzanAt, times, iqomahDelayMinutes: 10);
    final almostIqomah = getAdzanState(
      adzanAt.add(const Duration(minutes: 9, seconds: 59)),
      times,
      iqomahDelayMinutes: 10,
    );
    final atIqomah = getAdzanState(
      adzanAt.add(const Duration(minutes: 10)),
      times,
      iqomahDelayMinutes: 10,
    );

    expect(atAdzan.kind, AdzanStateKind.iqomahCountdown);
    expect(atAdzan.iqomahSecondsRemaining, 600);
    expect(almostIqomah.kind, AdzanStateKind.iqomahCountdown);
    expect(almostIqomah.iqomahSecondsRemaining, 1);
    expect(atIqomah.kind, AdzanStateKind.idle);
  });

  test('custom community delay uses the same timestamp model', () {
    final state = getAdzanState(
      adzanAt.add(const Duration(minutes: 11)),
      times,
      iqomahDelayMinutes: 12,
    );

    expect(state.kind, AdzanStateKind.iqomahCountdown);
    expect(state.iqomahSecondsRemaining, 60);
    expect(state.iqomahTimeMs, adzanAt.add(const Duration(minutes: 12)).millisecondsSinceEpoch);
  });
}
