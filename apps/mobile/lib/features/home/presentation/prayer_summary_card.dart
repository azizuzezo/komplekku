import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';

const _monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const _weekdayNames = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

/// The five daily prayers. Syuruq is a sun position rather than a prayer, so
/// the home summary leaves it out — the Shalat tab still lists it.
const _summaryPrayers = [
  PrayerName.subuh,
  PrayerName.dzuhur,
  PrayerName.ashar,
  PrayerName.maghrib,
  PrayerName.isya,
];

String _twoDigits(int value) => value.toString().padLeft(2, '0');

String _formatCountdown(int totalSeconds) {
  final hours = totalSeconds ~/ 3600;
  final minutes = (totalSeconds % 3600) ~/ 60;
  final seconds = totalSeconds % 60;
  return '${_twoDigits(hours)}:${_twoDigits(minutes)}:${_twoDigits(seconds)}';
}

/// "Jadwal Shalat Hari Ini" on the home screen: today's five times in a row,
/// with the next one raised and counting down. Tapping opens the Shalat tab.
///
/// This is a read-only summary — the adzan itself is fired by the OS-scheduled
/// notification in `PrayerSchedulerService`, not by anything on this screen.
class PrayerSummaryCard extends StatefulWidget {
  const PrayerSummaryCard({super.key});

  @override
  State<PrayerSummaryCard> createState() => _PrayerSummaryCardState();
}

class _PrayerSummaryCardState extends State<PrayerSummaryCard> {
  late DateTime _now;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final times = calculatePrayerTimes(date: _now);

    PrayerName nextPrayer = _summaryPrayers.first;
    DateTime nextAt = times[_summaryPrayers.first]!;
    var foundToday = false;
    for (final prayer in _summaryPrayers) {
      final at = times[prayer]!;
      if (at.isAfter(_now)) {
        nextPrayer = prayer;
        nextAt = at;
        foundToday = true;
        break;
      }
    }
    if (!foundToday) {
      // Past Isya: the next prayer is tomorrow's Subuh.
      final tomorrow = calculatePrayerTimes(
        date: _now.add(const Duration(days: 1)),
      );
      nextPrayer = PrayerName.subuh;
      nextAt = tomorrow[PrayerName.subuh]!;
    }

    final secondsToNext = max(0, nextAt.difference(_now).inSeconds);

    return Material(
      color: KomplekkuColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () => context.go('/shalat'),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: KomplekkuColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: KomplekkuColors.primary,
                    ),
                    child: const Icon(
                      Icons.mosque_outlined,
                      color: Colors.white,
                      size: 19,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Jadwal Shalat Hari Ini',
                          style: Theme.of(context)
                              .textTheme
                              .titleSmall
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        Text(
                          '${_weekdayNames[_now.weekday - 1]}, ${_now.day} '
                          '${_monthNames[_now.month - 1]} ${_now.year}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right,
                    color: KomplekkuColors.textSecondary,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final prayer in _summaryPrayers)
                    Expanded(
                      child: _PrayerColumn(
                        prayer: prayer,
                        at: times[prayer]!,
                        isNext: prayer == nextPrayer,
                        countdown: prayer == nextPrayer
                            ? _formatCountdown(secondsToNext)
                            : null,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrayerColumn extends StatelessWidget {
  const _PrayerColumn({
    required this.prayer,
    required this.at,
    required this.isNext,
    required this.countdown,
  });

  final PrayerName prayer;
  final DateTime at;
  final bool isNext;
  final String? countdown;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
      decoration: BoxDecoration(
        color: isNext ? KomplekkuColors.surfaceMuted : null,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isNext ? KomplekkuColors.primary : Colors.transparent,
        ),
      ),
      child: Column(
        children: [
          if (isNext)
            Container(
              margin: const EdgeInsets.only(bottom: 4),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: KomplekkuColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'NANTI',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.4,
                ),
              ),
            ),
          Text(
            prayerLabels[prayer]!,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isNext
                  ? KomplekkuColors.primary
                  : KomplekkuColors.textSecondary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            formatTime24(at),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: isNext
                  ? KomplekkuColors.primary
                  : KomplekkuColors.textPrimary,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          if (countdown != null) ...[
            const SizedBox(height: 2),
            Text(
              countdown!,
              style: const TextStyle(
                fontSize: 9,
                color: KomplekkuColors.textSecondary,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
