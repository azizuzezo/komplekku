import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/agenda/data/agenda_repository.dart';
import 'package:komplekku/features/agenda/domain/agenda_event.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

const _weekdayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

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

/// `YYYY-MM-DD`, the API's date-only agenda contract. Agenda dates are
/// wall-clock dates rather than instants, so the grid is built from plain
/// local [DateTime]s at midnight and never converted to UTC.
String _dateKey(DateTime date) =>
    '${date.year}-${_twoDigits(date.month)}-${_twoDigits(date.day)}';

DateTime _startOfMonth(DateTime date) => DateTime(date.year, date.month);

DateTime _dateOnly(DateTime date) =>
    DateTime(date.year, date.month, date.day);

/// The 6×7 grid covering [month], padded with the trailing days of the
/// previous month and leading days of the next so every week row is full.
List<DateTime> _buildMonthGrid(DateTime month) {
  final first = _startOfMonth(month);
  // DateTime.weekday is 1 = Monday … 7 = Sunday, which already matches the
  // Monday-first layout Indonesian calendars use.
  final gridStart = first.subtract(Duration(days: first.weekday - 1));
  return List.generate(42, (index) => gridStart.add(Duration(days: index)));
}

/// Month calendar over the community agenda: dots mark days that have
/// kegiatan, and tapping a day lists that day's events underneath.
class AgendaCalendarScreen extends ConsumerStatefulWidget {
  const AgendaCalendarScreen({super.key});

  @override
  ConsumerState<AgendaCalendarScreen> createState() =>
      _AgendaCalendarScreenState();
}

class _AgendaCalendarScreenState extends ConsumerState<AgendaCalendarScreen> {
  late DateTime _month;
  late DateTime _selectedDay;

  @override
  void initState() {
    super.initState();
    final today = _dateOnly(DateTime.now());
    _month = _startOfMonth(today);
    _selectedDay = today;
  }

  void _shiftMonth(int delta) {
    setState(() {
      _month = DateTime(_month.year, _month.month + delta);
    });
  }

  @override
  Widget build(BuildContext context) {
    final agenda = ref.watch(agendaByDateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kalender agenda'),
        actions: [
          IconButton(
            tooltip: 'Tampilan daftar',
            icon: const Icon(Icons.view_list_outlined),
            onPressed: () => context.push('/aktivitas/agenda'),
          ),
        ],
      ),
      body: SafeArea(
        child: agenda.when(
          loading: () => const _CalendarSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat kalender agenda.',
                actionLabel: 'Keluar',
                onAction: () =>
                    ref.read(sessionControllerProvider.notifier).signOut(),
              );
            }
            return StatePanel(
              icon: failure.isForbidden
                  ? Icons.block_outlined
                  : Icons.cloud_off_outlined,
              title: failure.isForbidden
                  ? 'Agenda belum dapat diakses'
                  : 'Kalender belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(agendaByDateProvider),
            );
          },
          data: (eventsByDate) => RefreshIndicator(
            onRefresh: () => ref.refresh(agendaByDateProvider.future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                _MonthHeader(
                  month: _month,
                  onPrevious: () => _shiftMonth(-1),
                  onNext: () => _shiftMonth(1),
                ),
                const SizedBox(height: 12),
                _MonthGrid(
                  month: _month,
                  selectedDay: _selectedDay,
                  eventsByDate: eventsByDate,
                  onSelect: (day) {
                    setState(() {
                      _selectedDay = day;
                      if (day.month != _month.month || day.year != _month.year) {
                        _month = _startOfMonth(day);
                      }
                    });
                  },
                ),
                const SizedBox(height: 20),
                _SelectedDaySection(
                  day: _selectedDay,
                  events: eventsByDate[_dateKey(_selectedDay)] ?? const [],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MonthHeader extends StatelessWidget {
  const _MonthHeader({
    required this.month,
    required this.onPrevious,
    required this.onNext,
  });

  final DateTime month;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          tooltip: 'Bulan sebelumnya',
          onPressed: onPrevious,
          icon: const Icon(Icons.chevron_left),
        ),
        Expanded(
          child: Semantics(
            liveRegion: true,
            child: Text(
              '${_monthNames[month.month - 1]} ${month.year}',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
          ),
        ),
        IconButton(
          tooltip: 'Bulan berikutnya',
          onPressed: onNext,
          icon: const Icon(Icons.chevron_right),
        ),
      ],
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.month,
    required this.selectedDay,
    required this.eventsByDate,
    required this.onSelect,
  });

  final DateTime month;
  final DateTime selectedDay;
  final Map<String, List<AgendaEvent>> eventsByDate;
  final ValueChanged<DateTime> onSelect;

  @override
  Widget build(BuildContext context) {
    final days = _buildMonthGrid(month);
    final todayKey = _dateKey(DateTime.now());
    final selectedKey = _dateKey(selectedDay);

    return Column(
      children: [
        Row(
          children: _weekdayLabels
              .map(
                (label) => Expanded(
                  child: Center(
                    child: Text(
                      label,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: KomplekkuColors.textSecondary,
                          ),
                    ),
                  ),
                ),
              )
              .toList(growable: false),
        ),
        const SizedBox(height: 6),
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          children: days.map((day) {
            final key = _dateKey(day);
            final dayEvents = eventsByDate[key] ?? const <AgendaEvent>[];
            final isOtherMonth = day.month != month.month;
            final isSelected = key == selectedKey;
            final isToday = key == todayKey;

            return _DayCell(
              day: day,
              eventCount: dayEvents.length,
              isOtherMonth: isOtherMonth,
              isSelected: isSelected,
              isToday: isToday,
              onTap: () => onSelect(_dateOnly(day)),
            );
          }).toList(growable: false),
        ),
      ],
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.day,
    required this.eventCount,
    required this.isOtherMonth,
    required this.isSelected,
    required this.isToday,
    required this.onTap,
  });

  final DateTime day;
  final int eventCount;
  final bool isOtherMonth;
  final bool isSelected;
  final bool isToday;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final foreground = isSelected
        ? Colors.white
        : isOtherMonth
            ? KomplekkuColors.textSecondary
            : KomplekkuColors.textPrimary;

    return Semantics(
      button: true,
      selected: isSelected,
      label: '${day.day} ${_monthNames[day.month - 1]} ${day.year}, '
          '${eventCount == 0 ? 'tidak ada agenda' : '$eventCount agenda'}',
      child: Material(
        color: isSelected
            ? KomplekkuColors.primary
            : isOtherMonth
                ? Colors.transparent
                : KomplekkuColors.surfaceSoft,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isToday && !isSelected
                    ? KomplekkuColors.primary
                    : Colors.transparent,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${day.day}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
                    color: foreground,
                  ),
                ),
                const SizedBox(height: 3),
                SizedBox(
                  height: 4,
                  child: eventCount == 0
                      ? null
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            eventCount > 3 ? 3 : eventCount,
                            (index) => Container(
                              width: 4,
                              height: 4,
                              margin: const EdgeInsets.symmetric(horizontal: 1),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected
                                    ? Colors.white
                                    : KomplekkuColors.primary,
                              ),
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SelectedDaySection extends StatelessWidget {
  const _SelectedDaySection({required this.day, required this.events});

  final DateTime day;
  final List<AgendaEvent> events;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${day.day} ${_monthNames[day.month - 1]} ${day.year}',
          style: Theme.of(context)
              .textTheme
              .titleSmall
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        if (events.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: KomplekkuColors.border),
            ),
            child: Text(
              'Tidak ada agenda pada tanggal ini.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          )
        else
          ...events.map(
            (event) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const Icon(
                    Icons.event_outlined,
                    color: KomplekkuColors.primary,
                  ),
                  title: Text(
                    event.title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${event.timeRangeLabel} · ${event.location}',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () =>
                      context.push('/aktivitas/agenda/${event.id}'),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _CalendarSkeleton extends StatelessWidget {
  const _CalendarSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat kalender agenda',
      liveRegion: true,
      child: ExcludeSemantics(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              height: 40,
              decoration: BoxDecoration(
                color: KomplekkuColors.surfaceSoft,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              height: 260,
              decoration: BoxDecoration(
                color: KomplekkuColors.surfaceSoft,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
