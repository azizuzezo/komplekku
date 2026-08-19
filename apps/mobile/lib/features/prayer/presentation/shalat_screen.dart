import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_header.dart';
import 'package:komplekku/shared/widgets/app_section_header.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';
import 'package:komplekku/features/prayer/data/prayer_settings_repository.dart';

/// Icons that read at a glance in a list: dawn, midday, afternoon, sunset,
/// night — the same order the prayer times run in.
const _prayerIcons = {
  PrayerName.subuh: Icons.nightlight_outlined,
  PrayerName.syuruq: Icons.wb_twilight,
  PrayerName.dzuhur: Icons.wb_sunny_outlined,
  PrayerName.ashar: Icons.wb_cloudy_outlined,
  PrayerName.maghrib: Icons.wb_twighlight,
  PrayerName.isya: Icons.dark_mode_outlined,
};

const _prayerSubtitles = {
  PrayerName.subuh: 'Awali hari dengan kebaikan',
  PrayerName.syuruq: 'Matahari terbit',
  PrayerName.dzuhur: 'Waktu istirahat dan bersyukur',
  PrayerName.ashar: 'Waktu terbaik untuk berdoa',
  PrayerName.maghrib: 'Saatnya berbuka dan bersyukur',
  PrayerName.isya: 'Tutup hari dengan mengingat Allah',
};

const _dailyQuote = (
  text:
      'Dirikanlah shalat, sesungguhnya shalat itu mencegah dari perbuatan keji '
      'dan mungkar.',
  source: 'QS. Al-Ankabut: 45',
);

const _weekdayShort = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

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

String _twoDigits(int value) => value.toString().padLeft(2, '0');

String _formatCountdown(int totalSeconds) {
  final hours = totalSeconds ~/ 3600;
  final minutes = (totalSeconds % 3600) ~/ 60;
  final seconds = totalSeconds % 60;
  return '${_twoDigits(hours)}:${_twoDigits(minutes)}:${_twoDigits(seconds)}';
}

/// The next prayer after [now], rolling over to tomorrow's Subuh once Isya has
/// passed.
({PrayerName name, DateTime at}) _nextPrayer(DateTime now) {
  final times = calculatePrayerTimes(date: now);
  for (final prayer in PrayerName.values) {
    final at = times[prayer]!;
    if (at.isAfter(now)) return (name: prayer, at: at);
  }
  final tomorrow = calculatePrayerTimes(date: now.add(const Duration(days: 1)));
  return (name: PrayerName.subuh, at: tomorrow[PrayerName.subuh]!);
}

enum _ShalatView { today, month }

class ShalatScreen extends ConsumerStatefulWidget {
  const ShalatScreen({super.key});

  @override
  ConsumerState<ShalatScreen> createState() => _ShalatScreenState();
}

class _ShalatScreenState extends ConsumerState<ShalatScreen> {
  _ShalatView _view = _ShalatView.today;
  late DateTime _now;
  Timer? _timer;

  /// Prayers the user silenced, mirrored locally so a tapped bell flips
  /// immediately instead of waiting for the reschedule to finish.
  Set<PrayerName> _muted = const {};
  bool _mutedLoaded = false;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
    _loadMuted();
  }

  Future<void> _loadMuted() async {
    final muted = await ref.read(prayerSchedulerServiceProvider).mutedPrayers();
    if (!mounted) return;
    setState(() {
      _muted = muted;
      _mutedLoaded = true;
    });
  }

  Future<void> _toggle(PrayerName prayer) async {
    final willEnable = _muted.contains(prayer);
    setState(() {
      final next = {..._muted};
      if (willEnable) {
        next.remove(prayer);
      } else {
        next.add(prayer);
      }
      _muted = next;
    });
    await ref
        .read(prayerSchedulerServiceProvider)
        .setPrayerEnabled(prayer, willEnable);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final times = calculatePrayerTimes(date: _now);
    final next = _nextPrayer(_now);
    final secondsToNext = max(0, next.at.difference(_now).inSeconds);
    final delayAsync = ref.watch(iqomahDelayMinutesProvider);
    final iqomahDelayMinutes =
        delayAsync.value ?? PrayerSettingsRepository.defaultIqomahDelayMinutes;
    final adzanState = getAdzanState(
      _now,
      times,
      iqomahDelayMinutes: iqomahDelayMinutes,
    );
    final health = ref.watch(prayerScheduleHealthProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.md,
            AppSpacing.lg,
            AppSpacing.xxl,
          ),
          children: [
            const _ScreenHeading(),
            const SizedBox(height: AppSpacing.base),
            if (!health.exactAlarmAllowed || health.lastError != null)
              PrayerScheduleHealthBanner(
                exactAlarmAllowed: health.exactAlarmAllowed,
                hasError: health.lastError != null,
                onOpenSettings: () => ref
                    .read(prayerSchedulerServiceProvider)
                    .openExactAlarmSettings(),
                onRetry: () => ref
                    .read(prayerSchedulerServiceProvider)
                    .rescheduleUpcomingPrayers(),
              ),
            if (!health.exactAlarmAllowed || health.lastError != null)
              const SizedBox(height: AppSpacing.base),
            _ViewSwitcher(
              view: _view,
              onChanged: (view) => setState(() => _view = view),
            ),
            const SizedBox(height: AppSpacing.base),
            if (_view == _ShalatView.today) ...[
              if (adzanState.kind == AdzanStateKind.iqomahCountdown)
                IqomahCountdownCard(state: adzanState)
              else
                _NextPrayerHero(
                  prayer: next.name,
                  at: next.at,
                  secondsRemaining: secondsToNext,
                ),
              const SizedBox(height: AppSpacing.lg),
              const AppSectionHeader(title: 'Jadwal Shalat Hari Ini'),
              _TodayList(
                times: times,
                activePrayer: next.name,
                muted: _muted,
                canToggle: _mutedLoaded,
                onToggle: _toggle,
              ),
              const SizedBox(height: AppSpacing.lg),
              const AppSectionHeader(title: 'Pratinjau Minggu Ini'),
              _WeekStrip(today: _now),
            ] else
              _MonthTable(month: _now),
            const SizedBox(height: AppSpacing.lg),
            const _QuoteCard(),
          ],
        ),
      ),
    );
  }
}

class _ScreenHeading extends StatelessWidget {
  const _ScreenHeading();

  @override
  Widget build(BuildContext context) {
    return const AppHeader(
      title: 'Jadwal Shalat',
      subtitle: 'RT 05 / RW 03 • Billabong',
      showAccount: true,
    );
  }
}

class _ViewSwitcher extends StatelessWidget {
  const _ViewSwitcher({required this.view, required this.onChanged});

  final _ShalatView view;
  final ValueChanged<_ShalatView> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xs),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          for (final entry in const [
            (_ShalatView.today, 'Hari ini'),
            (_ShalatView.month, 'Bulanan'),
          ])
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(entry.$1),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: view == entry.$1
                        ? AppColors.primary
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: Text(
                    entry.$2,
                    textAlign: TextAlign.center,
                    style: AppTypography.label.copyWith(
                      color: view == entry.$1
                          ? AppColors.surface
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// The single primary element on this screen: the current/next prayer.
/// Kept restrained per /design.md ("no oversized dashboard hero") — the time
/// uses `AppTypography.heading`, not `display`, so it reads at a glance
/// without shouting over the supporting rail below it.
class _NextPrayerHero extends StatelessWidget {
  const _NextPrayerHero({
    required this.prayer,
    required this.at,
    required this.secondsRemaining,
  });

  final PrayerName prayer;
  final DateTime at;
  final int secondsRemaining;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary,
            ),
            child: Icon(_prayerIcons[prayer], color: AppColors.surface, size: 26),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppBadge(label: 'SELANJUTNYA', tone: AppBadgeTone.brand),
                const SizedBox(height: AppSpacing.sm),
                Text(prayerLabels[prayer]!, style: AppTypography.title),
                Text(
                  formatTime24(at),
                  style: AppTypography.tabular(
                    AppTypography.heading,
                  ).copyWith(color: AppColors.primary),
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    const Icon(
                      Icons.schedule,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      '${_formatCountdown(secondsRemaining)} menuju waktu',
                      style: AppTypography.tabular(AppTypography.caption),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// From the adzan timestamp until iqomah: a soft-purple card with the
/// MM:SS countdown, the exact iqomah clock time, and a progress bar whose
/// end lines up with the same timestamp Android schedules the iqomah alarm
/// for, so the on-screen countdown and the native alarm never disagree.
///
/// This replaces `_NextPrayerHero` as the screen's single primary element
/// while iqomah is counting down, so it shares the same restrained scale
/// (`AppTypography.heading`, not `display`).
class IqomahCountdownCard extends StatelessWidget {
  const IqomahCountdownCard({super.key, required this.state});

  final AdzanState state;

  @override
  Widget build(BuildContext context) {
    final prayer = state.activePrayer!;
    final adzanAt = DateTime.fromMillisecondsSinceEpoch(state.adzanTimeMs!);
    final iqomahAt = DateTime.fromMillisecondsSinceEpoch(state.iqomahTimeMs!);
    final totalSeconds = max(
      1,
      iqomahAt.difference(adzanAt).inSeconds,
    );
    final progress =
        (totalSeconds - state.iqomahSecondsRemaining) / totalSeconds;

    return Semantics(
      liveRegion: true,
      label:
          'Menuju iqomah ${prayerLabels[prayer]}, tersisa '
          '${formatDurationMMSS(state.iqomahSecondsRemaining)}',
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.primary),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary,
                  ),
                  child: const Icon(
                    Icons.mosque,
                    color: AppColors.surface,
                    size: 20,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    'Menuju Iqomah ${prayerLabels[prayer]}',
                    style: AppTypography.title.copyWith(color: AppColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.base),
            Center(
              child: Text(
                formatDurationMMSS(state.iqomahSecondsRemaining),
                style: AppTypography.tabular(
                  AppTypography.heading,
                ).copyWith(color: AppColors.primary),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.small),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                minHeight: 8,
                backgroundColor: AppColors.primary.withValues(
                  alpha: 0.15,
                ),
                valueColor: const AlwaysStoppedAnimation(
                  AppColors.primary,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Iqomah pukul ${formatTime24(iqomahAt)}',
              style: AppTypography.tabular(AppTypography.caption),
            ),
          ],
        ),
      ),
    );
  }
}

/// Persistent — never a transient snackbar — because a missed adzan is not
/// something a resident should have to notice was silently skipped. The
/// permission-vs-error distinction is a real operational status, so it routes
/// through `AppBadge` tones (warning for a permission gap, danger for an
/// actual scheduling failure) instead of the ad hoc amber it used to carry.
class PrayerScheduleHealthBanner extends StatelessWidget {
  const PrayerScheduleHealthBanner({
    super.key,
    required this.exactAlarmAllowed,
    required this.hasError,
    required this.onOpenSettings,
    required this.onRetry,
  });

  final bool exactAlarmAllowed;
  final bool hasError;
  final VoidCallback onOpenSettings;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final isPermissionIssue = !exactAlarmAllowed;
    final message = isPermissionIssue
        ? 'Alarm mungkin terlambat. Izinkan alarm & pengingat tepat waktu agar adzan berbunyi otomatis.'
        : 'Adzan otomatis gagal dijadwalkan. Periksa izin notifikasi dan alarm, lalu coba lagi.';
    final actionLabel = isPermissionIssue ? 'Buka Pengaturan' : 'Coba Lagi';
    final onAction = isPermissionIssue ? onOpenSettings : onRetry;
    final tone = isPermissionIssue ? AppBadgeTone.warning : AppBadgeTone.danger;
    final chromeColor = isPermissionIssue ? AppColors.warning : AppColors.danger;
    final badgeLabel = isPermissionIssue ? 'Izin Diperlukan' : 'Gagal Dijadwalkan';

    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          color: chromeColor.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(AppRadius.modal),
          border: Border.all(color: chromeColor.withValues(alpha: 0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppBadge(
              label: badgeLabel,
              tone: tone,
              icon: Icons.warning_amber_rounded,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              style: AppTypography.body.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            SizedBox(
              height: 40,
              child: OutlinedButton(
                onPressed: onAction,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(
                    color: AppColors.primary,
                  ),
                ),
                child: Text(actionLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TodayList extends StatelessWidget {
  const _TodayList({
    required this.times,
    required this.activePrayer,
    required this.muted,
    required this.canToggle,
    required this.onToggle,
  });

  final Map<PrayerName, DateTime> times;
  final PrayerName activePrayer;
  final Set<PrayerName> muted;
  final bool canToggle;
  final ValueChanged<PrayerName> onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (final prayer in PrayerName.values) ...[
            _PrayerRow(
              prayer: prayer,
              at: times[prayer]!,
              isActive: prayer == activePrayer,
              // Syuruq is a sun position, not a prayer — the scheduler never
              // sounds an adzan for it, so it gets no bell.
              isSchedulable: PrayerSchedulerService.schedulablePrayers.contains(
                prayer,
              ),
              isMuted: muted.contains(prayer),
              canToggle: canToggle,
              onToggle: () => onToggle(prayer),
            ),
            if (prayer != PrayerName.values.last)
              const Divider(height: 1, color: AppColors.border),
          ],
        ],
      ),
    );
  }
}

class _PrayerRow extends StatelessWidget {
  const _PrayerRow({
    required this.prayer,
    required this.at,
    required this.isActive,
    required this.isSchedulable,
    required this.isMuted,
    required this.canToggle,
    required this.onToggle,
  });

  final PrayerName prayer;
  final DateTime at;
  final bool isActive;
  final bool isSchedulable;
  final bool isMuted;
  final bool canToggle;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: isActive ? AppColors.surfaceMuted : null,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Icon(
            _prayerIcons[prayer],
            size: 24,
            color: isActive
                ? AppColors.primary
                : AppColors.textSecondary,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prayerLabels[prayer]!,
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w700,
                    color: isActive
                        ? AppColors.primary
                        : AppColors.textPrimary,
                  ),
                ),
                Text(
                  _prayerSubtitles[prayer]!,
                  style: AppTypography.caption,
                ),
              ],
            ),
          ),
          Text(
            formatTime24(at),
            style: AppTypography.tabular(AppTypography.bodyLarge).copyWith(
              fontWeight: FontWeight.w800,
              color: isActive
                  ? AppColors.primary
                  : AppColors.textPrimary,
            ),
          ),
          if (isSchedulable) ...[
            const SizedBox(width: AppSpacing.sm),
            IconButton(
              onPressed: canToggle ? onToggle : null,
              tooltip: isMuted
                  ? 'Nyalakan adzan ${prayerLabels[prayer]}'
                  : 'Matikan adzan ${prayerLabels[prayer]}',
              icon: Icon(
                isMuted
                    ? Icons.notifications_off_outlined
                    : Icons.notifications_active,
                size: 20,
                color: isMuted
                    ? AppColors.textSecondary
                    : AppColors.primary,
              ),
            ),
          ] else
            const SizedBox(width: 48),
        ],
      ),
    );
  }
}

class _WeekStrip extends StatelessWidget {
  const _WeekStrip({required this.today});

  final DateTime today;

  @override
  Widget build(BuildContext context) {
    final days = List.generate(7, (index) => today.add(Duration(days: index)));

    return SizedBox(
      height: 92,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: days.length,
        separatorBuilder: (context, index) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (context, index) {
          final day = days[index];
          final isToday = index == 0;
          final maghrib = calculatePrayerTimes(date: day)[PrayerName.maghrib]!;
          return Container(
            width: 78,
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
            decoration: BoxDecoration(
              color: isToday
                  ? AppColors.surfaceMuted
                  : AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(AppRadius.medium),
              border: Border.all(
                color: isToday
                    ? AppColors.primary
                    : AppColors.border,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _weekdayShort[day.weekday - 1],
                  style: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w700,
                    color: isToday
                        ? AppColors.primary
                        : AppColors.textPrimary,
                  ),
                ),
                Text(
                  '${day.day} ${_monthNames[day.month - 1].substring(0, 3)}',
                  style: AppTypography.caption,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Maghrib ${formatTime24(maghrib)}',
                  style: AppTypography.tabular(AppTypography.caption),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Full-month table. Prayer times are computed locally, so a month view costs
/// nothing more than a loop — no extra API call.
class _MonthTable extends StatelessWidget {
  const _MonthTable({required this.month});

  final DateTime month;

  @override
  Widget build(BuildContext context) {
    final dayCount = DateTime(month.year, month.month + 1, 0).day;
    final today = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppSectionHeader(
          title: '${_monthNames[month.month - 1]} ${month.year}',
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: AppColors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              Container(
                color: AppColors.surfaceSoft,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.sm,
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 44,
                      child: Text(
                        'Tgl',
                        style: AppTypography.caption.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    for (final prayer
                        in PrayerSchedulerService.schedulablePrayers)
                      Expanded(
                        child: Text(
                          prayerLabels[prayer]!.substring(0, 3),
                          textAlign: TextAlign.center,
                          style: AppTypography.caption.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              for (var dayNumber = 1; dayNumber <= dayCount; dayNumber++)
                _MonthRow(
                  date: DateTime(month.year, month.month, dayNumber),
                  isToday:
                      dayNumber == today.day &&
                      month.month == today.month &&
                      month.year == today.year,
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MonthRow extends StatelessWidget {
  const _MonthRow({required this.date, required this.isToday});

  final DateTime date;
  final bool isToday;

  @override
  Widget build(BuildContext context) {
    final times = calculatePrayerTimes(date: date);
    return Container(
      color: isToday ? AppColors.surfaceMuted : null,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          SizedBox(
            width: 44,
            child: Text(
              '${date.day} ${_weekdayShort[date.weekday - 1]}',
              style: AppTypography.caption.copyWith(
                fontWeight: isToday ? FontWeight.w800 : FontWeight.w600,
                color: isToday
                    ? AppColors.primary
                    : AppColors.textSecondary,
              ),
            ),
          ),
          for (final prayer in PrayerSchedulerService.schedulablePrayers)
            Expanded(
              child: Text(
                formatTime24(times[prayer]!),
                textAlign: TextAlign.center,
                style: AppTypography.tabular(AppTypography.caption).copyWith(
                  fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
                  color: isToday
                      ? AppColors.primary
                      : AppColors.textPrimary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _QuoteCard extends StatelessWidget {
  const _QuoteCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.base),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary,
            ),
            child: const Icon(
              Icons.format_quote,
              color: AppColors.surface,
              size: 18,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _dailyQuote.text,
                  style: AppTypography.body.copyWith(
                    fontStyle: FontStyle.italic,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  _dailyQuote.source,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
