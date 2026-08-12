import 'dart:math';

class Coordinates {
  final double latitude;
  final double longitude;

  const Coordinates(this.latitude, this.longitude);
}

const defaultCoordinates = Coordinates(-6.5204, 106.7725);

enum PrayerName { subuh, syuruq, dzuhur, ashar, maghrib, isya }

const prayerLabels = {
  PrayerName.subuh: 'Subuh',
  PrayerName.syuruq: 'Terbit',
  PrayerName.dzuhur: 'Dzuhur',
  PrayerName.ashar: 'Ashar',
  PrayerName.maghrib: 'Maghrib',
  PrayerName.isya: 'Isya',
};

enum AdzanStateKind { idle, adzan, postAdzanGap, iqomahCountdown, sholat }

class AdzanState {
  final AdzanStateKind kind;
  final PrayerName? activePrayer;
  final int? adzanTimeMs;
  final int gapSecondsRemaining;
  final int iqomahSecondsRemaining;

  const AdzanState({
    required this.kind,
    this.activePrayer,
    this.adzanTimeMs,
    this.gapSecondsRemaining = 0,
    this.iqomahSecondsRemaining = 0,
  });
}

Map<PrayerName, DateTime> calculatePrayerTimes({
  Coordinates coords = defaultCoordinates,
  DateTime? date,
}) {
  final dDate = date ?? DateTime.now();
  final year = dDate.year;
  final month = dDate.month;
  final day = dDate.day;

  final a = ((14 - month) / 12).floor();
  final y = year + 4800 - a;
  final m = month + 12 * a - 3;
  final jd = day +
      ((153 * m + 2) / 5).floor() +
      365 * y +
      (y / 4).floor() -
      (y / 100).floor() +
      (y / 400).floor() -
      32045;

  final d = jd - 2451545.0;

  final g = 357.529 + 0.98560028 * d;
  final q = 280.459 + 0.98564736 * d;
  final l = q + 1.915 * sin(g * pi / 180) + 0.02 * sin(2 * g * pi / 180);
  final e = 23.439 - 0.00000036 * d;

  final ra = (atan2(cos(e * pi / 180) * sin(l * pi / 180), cos(l * pi / 180)) *
          180) /
      pi;
  final dec =
      (asin(sin(e * pi / 180) * sin(l * pi / 180)) * 180) / pi;
  final eqT = q / 15 - (((ra < 0 ? ra + 360 : ra) % 360) / 15);

  final timezone = dDate.timeZoneOffset.inMinutes / 60.0;
  const longitude = 106.7725;
  const latitude = -6.5204;

  final transit = 12 + timezone - longitude / 15 - eqT;

  final rad = pi / 180;
  final latRad = latitude * rad;
  final declRad = dec * rad;

  double hourAngle(double angle) {
    final cosHA =
        (-sin(angle * rad) - sin(latRad) * sin(declRad)) /
            (cos(latRad) * cos(declRad));
    if (cosHA > 1 || cosHA < -1) return 0;
    return (acos(cosHA) * 180) / pi / 15;
  }

  final subuhHA = hourAngle(20);
  final isyaHA = hourAngle(18);
  final syuruqHA = hourAngle(0.833);

  final asharAngle =
      (atan(1 + tan((latRad - declRad).abs())) * 180) / pi;
  final asharHA = hourAngle(90 - asharAngle);

  DateTime makeDate(double hoursFloat) {
    final totalMinutes = (hoursFloat * 60).round();
    final hours = totalMinutes ~/ 60;
    final minutes = totalMinutes % 60;
    return DateTime(year, month, day, hours, minutes);
  }

  const ihtiyatiMinutes = 2 / 60;

  return {
    PrayerName.subuh: makeDate(transit - subuhHA + ihtiyatiMinutes),
    PrayerName.syuruq: makeDate(transit - syuruqHA),
    PrayerName.dzuhur: makeDate(transit + ihtiyatiMinutes),
    PrayerName.ashar: makeDate(transit + asharHA + ihtiyatiMinutes),
    PrayerName.maghrib: makeDate(transit + syuruqHA + ihtiyatiMinutes),
    PrayerName.isya: makeDate(transit + isyaHA + ihtiyatiMinutes),
  };
}

AdzanState getAdzanState(DateTime now, Map<PrayerName, DateTime> times) {
  final nowMs = now.millisecondsSinceEpoch;
  const postAdzanGapMs = 5 * 60 * 1000;
  const iqomahCountdownMs = 6 * 60 * 1000;
  const totalWindowMs = postAdzanGapMs + iqomahCountdownMs;

  const prayers = [
    PrayerName.subuh,
    PrayerName.dzuhur,
    PrayerName.ashar,
    PrayerName.maghrib,
    PrayerName.isya
  ];

  for (final prayer in prayers) {
    final pTimeMs = times[prayer]!.millisecondsSinceEpoch;
    final elapsed = nowMs - pTimeMs;

    if (elapsed >= 0 && elapsed < totalWindowMs) {
      if (elapsed < 30 * 1000) {
        return AdzanState(
          kind: AdzanStateKind.adzan,
          activePrayer: prayer,
          adzanTimeMs: pTimeMs,
          gapSecondsRemaining: ((postAdzanGapMs - elapsed) / 1000).ceil(),
          iqomahSecondsRemaining: 360,
        );
      } else if (elapsed < postAdzanGapMs) {
        return AdzanState(
          kind: AdzanStateKind.postAdzanGap,
          activePrayer: prayer,
          adzanTimeMs: pTimeMs,
          gapSecondsRemaining: ((postAdzanGapMs - elapsed) / 1000).ceil(),
          iqomahSecondsRemaining: 360,
        );
      } else {
        final iqomahElapsed = elapsed - postAdzanGapMs;
        final remaining = max(0, ((iqomahCountdownMs - iqomahElapsed) / 1000).ceil());
        return AdzanState(
          kind: AdzanStateKind.iqomahCountdown,
          activePrayer: prayer,
          adzanTimeMs: pTimeMs,
          gapSecondsRemaining: 0,
          iqomahSecondsRemaining: remaining,
        );
      }
    }
  }

  return const AdzanState(kind: AdzanStateKind.idle);
}

String formatDurationMMSS(int seconds) {
  final m = seconds ~/ 60;
  final s = seconds % 60;
  return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
}

String formatTime24(DateTime dt) {
  return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
}
