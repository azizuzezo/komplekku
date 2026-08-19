import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';
import 'package:komplekku/features/prayer/data/prayer_settings_repository.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

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
class PrayerSummaryCard extends ConsumerStatefulWidget {
  const PrayerSummaryCard({super.key});

  @override
  ConsumerState<PrayerSummaryCard> createState() => _PrayerSummaryCardState();
}

class _PrayerSummaryCardState extends ConsumerState<PrayerSummaryCard> {
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
    final delayAsync = ref.watch(iqomahDelayMinutesProvider);
    final iqomahDelayMinutes =
        delayAsync.value ?? PrayerSettingsRepository.defaultIqomahDelayMinutes;
    final adzanState = getAdzanState(
      _now,
      times,
      iqomahDelayMinutes: iqomahDelayMinutes,
    );

    return AppCard(
      onTap: () => context.go('/shalat'),
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
                  color: AppColors.primary,
                ),
                child: const Icon(
                  Icons.mosque_outlined,
                  color: AppColors.surface,
                  size: 19,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Jadwal Shalat Hari Ini',
                      style: AppTypography.label,
                    ),
                    Text(
                      '${_weekdayNames[_now.weekday - 1]}, ${_now.day} '
                      '${_monthNames[_now.month - 1]} ${_now.year}',
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textSecondary,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (adzanState.kind == AdzanStateKind.iqomahCountdown)
            _CompactIqomahRow(state: adzanState)
          else
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
    );
  }
}

/// The compact Beranda echo of Shalat's purple iqomah card — same countdown,
/// same timestamp, just without the progress bar so it fits one row.
class _CompactIqomahRow extends StatelessWidget {
  const _CompactIqomahRow({required this.state});

  final AdzanState state;

  @override
  Widget build(BuildContext context) {
    final prayer = state.activePrayer!;
    return Semantics(
      liveRegion: true,
      label:
          'Menuju iqomah ${prayerLabels[prayer]}, tersisa '
          '${formatDurationMMSS(state.iqomahSecondsRemaining)}',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.medium),
          border: Border.all(color: AppColors.primary),
        ),
        child: Row(
          children: [
            const Icon(Icons.mosque, color: AppColors.primary, size: 18),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                'Menuju Iqomah ${prayerLabels[prayer]}',
                style: AppTypography.body.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
            Text(
              formatDurationMMSS(state.iqomahSecondsRemaining),
              style: AppTypography.tabular(AppTypography.bodyLarge).copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
          ],
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
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.sm,
        horizontal: 2,
      ),
      decoration: BoxDecoration(
        color: isNext ? AppColors.surfaceMuted : null,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(
          color: isNext ? AppColors.primary : Colors.transparent,
        ),
      ),
      child: Column(
        children: [
          if (isNext)
            const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.xs),
              child: AppBadge(label: 'NANTI', tone: AppBadgeTone.brand),
            ),
          Text(
            prayerLabels[prayer]!,
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w600,
              color: isNext
                  ? AppColors.primary
                  : AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            formatTime24(at),
            style: AppTypography.tabular(AppTypography.label).copyWith(
              fontWeight: FontWeight.w800,
              color: isNext
                  ? AppColors.primary
                  : AppColors.textPrimary,
            ),
          ),
          if (countdown != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              countdown!,
              style: AppTypography.tabular(AppTypography.caption),
            ),
          ],
        ],
      ),
    );
  }
}
