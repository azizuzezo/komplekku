import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/widgets/prototype_header.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';

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

    return Scaffold(
      backgroundColor: KomplekkuColors.background,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            const _ScreenHeading(),
            const SizedBox(height: 16),
            _ViewSwitcher(
              view: _view,
              onChanged: (view) => setState(() => _view = view),
            ),
            const SizedBox(height: 16),
            if (_view == _ShalatView.today) ...[
              _NextPrayerHero(
                prayer: next.name,
                at: next.at,
                secondsRemaining: secondsToNext,
              ),
              const SizedBox(height: 20),
              Text(
                'Jadwal Shalat Hari Ini',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),
              _TodayList(
                times: times,
                activePrayer: next.name,
                muted: _muted,
                canToggle: _mutedLoaded,
                onToggle: _toggle,
              ),
              const SizedBox(height: 20),
              Text(
                'Pratinjau Minggu Ini',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),
              _WeekStrip(today: _now),
            ] else
              _MonthTable(month: _now),
            const SizedBox(height: 20),
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
    return const PrototypeHeader(
      title: 'Jadwal Shalat',
      subtitle: 'RT 05 / RW 03 • Billabong',
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
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: KomplekkuColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: KomplekkuColors.border),
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
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: view == entry.$1
                        ? KomplekkuColors.primary
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    entry.$2,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: view == entry.$1
                          ? Colors.white
                          : KomplekkuColors.textSecondary,
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: KomplekkuColors.surfaceMuted,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: KomplekkuColors.primary.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: KomplekkuColors.primary,
            ),
            child: Icon(_prayerIcons[prayer], color: Colors.white, size: 30),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: KomplekkuColors.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'SELANJUTNYA',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  prayerLabels[prayer]!,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                Text(
                  formatTime24(at),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: KomplekkuColors.primary,
                    fontWeight: FontWeight.w800,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.schedule,
                      size: 14,
                      color: KomplekkuColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${_formatCountdown(secondsRemaining)} menuju waktu',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
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
        color: KomplekkuColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: KomplekkuColors.border),
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
              const Divider(height: 1, color: KomplekkuColors.border),
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
      color: isActive ? KomplekkuColors.surfaceMuted : null,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(
            _prayerIcons[prayer],
            size: 24,
            color: isActive
                ? KomplekkuColors.primary
                : KomplekkuColors.textSecondary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prayerLabels[prayer]!,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: isActive
                        ? KomplekkuColors.primary
                        : KomplekkuColors.textPrimary,
                  ),
                ),
                Text(
                  _prayerSubtitles[prayer]!,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Text(
            formatTime24(at),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: isActive
                  ? KomplekkuColors.primary
                  : KomplekkuColors.textPrimary,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          if (isSchedulable) ...[
            const SizedBox(width: 6),
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
                    ? KomplekkuColors.textSecondary
                    : KomplekkuColors.primary,
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
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final day = days[index];
          final isToday = index == 0;
          final maghrib = calculatePrayerTimes(date: day)[PrayerName.maghrib]!;
          return Container(
            width: 78,
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: isToday
                  ? KomplekkuColors.surfaceMuted
                  : KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isToday
                    ? KomplekkuColors.primary
                    : KomplekkuColors.border,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _weekdayShort[day.weekday - 1],
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: isToday
                        ? KomplekkuColors.primary
                        : KomplekkuColors.textPrimary,
                  ),
                ),
                Text(
                  '${day.day} ${_monthNames[day.month - 1].substring(0, 3)}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 6),
                Text(
                  'Maghrib ${formatTime24(maghrib)}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: KomplekkuColors.textSecondary,
                  ),
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
        Text(
          '${_monthNames[month.month - 1]} ${month.year}',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: KomplekkuColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: KomplekkuColors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              Container(
                color: KomplekkuColors.surfaceSoft,
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    const SizedBox(
                      width: 44,
                      child: Text(
                        'Tgl',
                        style: TextStyle(
                          fontSize: 11,
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
                          style: const TextStyle(
                            fontSize: 11,
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
      color: isToday ? KomplekkuColors.surfaceMuted : null,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      child: Row(
        children: [
          SizedBox(
            width: 44,
            child: Text(
              '${date.day} ${_weekdayShort[date.weekday - 1]}',
              style: TextStyle(
                fontSize: 11,
                fontWeight: isToday ? FontWeight.w800 : FontWeight.w600,
                color: isToday
                    ? KomplekkuColors.primary
                    : KomplekkuColors.textSecondary,
              ),
            ),
          ),
          for (final prayer in PrayerSchedulerService.schedulablePrayers)
            Expanded(
              child: Text(
                formatTime24(times[prayer]!),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
                  color: isToday
                      ? KomplekkuColors.primary
                      : KomplekkuColors.textPrimary,
                  fontFeatures: const [FontFeature.tabularFigures()],
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: KomplekkuColors.surfaceMuted,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: KomplekkuColors.primary,
            ),
            child: const Icon(
              Icons.format_quote,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _dailyQuote.text,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontStyle: FontStyle.italic,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _dailyQuote.source,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KomplekkuColors.primary,
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
