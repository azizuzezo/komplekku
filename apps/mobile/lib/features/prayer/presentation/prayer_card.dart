import 'dart:async';
import 'dart:math';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/notifications/push_notification_service.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';

const _weekdayNames = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

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

String _formatIndonesianDate(DateTime date) {
  final weekday = _weekdayNames[date.weekday - 1];
  final month = _monthNames[date.month - 1];
  return '$weekday, ${date.day} $month ${date.year}';
}

String _formatCountdown(int totalSeconds) {
  final hours = totalSeconds ~/ 3600;
  final minutes = (totalSeconds % 3600) ~/ 60;
  final seconds = totalSeconds % 60;
  final mm = minutes.toString().padLeft(2, '0');
  final ss = seconds.toString().padLeft(2, '0');
  if (hours > 0) return '${hours}j ${mm}m ${ss}d';
  return '${minutes}m ${ss}d';
}

class PrayerCard extends ConsumerStatefulWidget {
  const PrayerCard({super.key});

  @override
  ConsumerState<PrayerCard> createState() => _PrayerCardState();
}

class _PrayerCardState extends ConsumerState<PrayerCard> {
  late DateTime _now;
  Timer? _timer;
  bool _isMuted = false;
  bool _isPlayingAudio = false;
  late final AudioPlayer _audioPlayer;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _audioPlayer = AudioPlayer();

    _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _isPlayingAudio = false;
        });
      }
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _now = DateTime.now();
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _playAudio(String asset, {String? prayerName}) async {
    if (_isMuted && prayerName != null) return;
    try {
      await _audioPlayer.stop();
      await _audioPlayer.play(AssetSource(asset));
      setState(() {
        _isPlayingAudio = true;
      });

      if (prayerName != null) {
        ref.read(pushNotificationServiceProvider).showNotification(
              id: 999,
              title: '📢 Waktu Adzan $prayerName Tiba',
              body:
                  'Kumandang adzan $prayerName telah masuk. Mari persiapkan diri untuk sholat.',
            );
      }
    } catch (_) {
      // Audio playback fallback handle
    }
  }

  Future<void> _stopAudio() async {
    await _audioPlayer.stop();
    setState(() {
      _isPlayingAudio = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final times = calculatePrayerTimes(date: _now);
    final adzanState = getAdzanState(_now, times);

    final timeString =
        '${_now.hour.toString().padLeft(2, '0')}:${_now.minute.toString().padLeft(2, '0')}:${_now.second.toString().padLeft(2, '0')}';

    final upcoming = [
      MapEntry(PrayerName.subuh, times[PrayerName.subuh]!),
      MapEntry(PrayerName.syuruq, times[PrayerName.syuruq]!),
      MapEntry(PrayerName.dzuhur, times[PrayerName.dzuhur]!),
      MapEntry(PrayerName.ashar, times[PrayerName.ashar]!),
      MapEntry(PrayerName.maghrib, times[PrayerName.maghrib]!),
      MapEntry(PrayerName.isya, times[PrayerName.isya]!),
    ];

    final nextEntry = upcoming.firstWhere(
      (e) => e.value.isAfter(_now),
      orElse: () {
        final tomorrow = _now.add(const Duration(days: 1));
        final tTimes = calculatePrayerTimes(date: tomorrow);
        return MapEntry(PrayerName.subuh, tTimes[PrayerName.subuh]!);
      },
    );

    final secondsToNext = max(0, nextEntry.value.difference(_now).inSeconds);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: KomplekkuColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: KomplekkuColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Dark hero header: clock, date, location badge, audio controls
          Container(
            color: KomplekkuColors.textPrimary,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    Text(
                      timeString,
                      style: const TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'monospace',
                        color: Colors.white,
                        height: 1,
                      ),
                    ),
                    const Text(
                      'WIB',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                        color: KomplekkuColors.borderStrong,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: KomplekkuColors.primary.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: KomplekkuColors.primary.withValues(alpha: 0.4),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.explore_outlined,
                            size: 12,
                            color: KomplekkuColors.borderStrong,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Lokasi Komplek',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: KomplekkuColors.surfaceMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  _formatIndonesianDate(_now),
                  style: const TextStyle(
                    fontSize: 12,
                    color: KomplekkuColors.surfaceMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    _HeaderButton(
                      label: 'Adzan',
                      icon: Icons.play_arrow,
                      background: KomplekkuColors.primary,
                      foreground: Colors.white,
                      onPressed: _isPlayingAudio
                          ? null
                          : () => _playAudio(
                              'audio/adzan.mp3',
                              prayerName: prayerLabels[nextEntry.key],
                            ),
                    ),
                    _HeaderButton(
                      label: 'Iqomah',
                      icon: Icons.volume_up,
                      background: KomplekkuColors.borderStrong,
                      foreground: KomplekkuColors.textPrimary,
                      onPressed: _isPlayingAudio
                          ? null
                          : () => _playAudio('audio/iqomah.wav'),
                    ),
                    if (_isPlayingAudio)
                      _HeaderButton(
                        label: 'Stop',
                        icon: Icons.stop_circle_outlined,
                        background: KomplekkuColors.danger.withValues(
                          alpha: 0.18,
                        ),
                        foreground: KomplekkuColors.danger,
                        onPressed: _stopAudio,
                      ),
                    IconButton(
                      onPressed: () => setState(() => _isMuted = !_isMuted),
                      tooltip: _isMuted
                          ? 'Auto-adzan mati'
                          : 'Auto-adzan aktif',
                      icon: Icon(
                        _isMuted ? Icons.volume_off : Icons.volume_up_outlined,
                        size: 18,
                        color: _isMuted
                            ? Colors.white.withValues(alpha: 0.4)
                            : Colors.white,
                      ),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withValues(
                          alpha: _isMuted ? 0.08 : 0.15,
                        ),
                        minimumSize: const Size(34, 34),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Next Prayer Countdown Bar
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: KomplekkuColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: KomplekkuColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: KomplekkuColors.textPrimary,
                            ),
                            children: [
                              const TextSpan(text: 'Menuju sholat '),
                              TextSpan(
                                text: prayerLabels[nextEntry.key],
                                style: const TextStyle(
                                  color: KomplekkuColors.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              TextSpan(
                                text: ' (${formatTime24(nextEntry.value)})',
                              ),
                            ],
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: KomplekkuColors.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: KomplekkuColors.border),
                        ),
                        child: Text(
                          '-${_formatCountdown(secondsToNext)}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                            color: KomplekkuColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Adzan & Iqomah Banner
                if (adzanState.kind != AdzanStateKind.idle &&
                    adzanState.activePrayer != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: KomplekkuColors.surfaceSoft,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: KomplekkuColors.primary),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (adzanState.kind == AdzanStateKind.adzan) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '📢 Waktu Adzan ${prayerLabels[adzanState.activePrayer]} Tiba',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: KomplekkuColors.primary,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: () => _playAudio(
                                  'audio/adzan.mp3',
                                  prayerName:
                                      prayerLabels[adzanState.activePrayer],
                                ),
                                child: const Text('Putar Adzan'),
                              ),
                            ],
                          ),
                        ],
                        if (adzanState.kind == AdzanStateKind.postAdzanGap) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Adzan ${prayerLabels[adzanState.activePrayer]} Berkumandang',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                    const Text(
                                      'Jeda persiapan (5m)',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: KomplekkuColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                formatDurationMMSS(
                                  adzanState.gapSecondsRemaining,
                                ),
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: KomplekkuColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ],
                        if (adzanState.kind ==
                            AdzanStateKind.iqomahCountdown) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Hitung Mundur Iqomah ${prayerLabels[adzanState.activePrayer]}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: KomplekkuColors.danger,
                                      ),
                                    ),
                                    const Text(
                                      'Menuju sholat berjamaah',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: KomplekkuColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  TextButton(
                                    onPressed: () =>
                                        _playAudio('audio/iqomah.wav'),
                                    child: const Text('Suara Iqomah'),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    formatDurationMMSS(
                                      adzanState.iqomahSecondsRemaining,
                                    ),
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                      color: KomplekkuColors.danger,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // 6 Grid Items
                Row(
                  children: [
                        PrayerName.subuh,
                        PrayerName.syuruq,
                        PrayerName.dzuhur,
                        PrayerName.ashar,
                        PrayerName.maghrib,
                        PrayerName.isya,
                      ]
                      .map((pName) {
                        final isNext = pName == nextEntry.key;
                        final isActiveAdzan = adzanState.activePrayer == pName;

                        return Expanded(
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: isActiveAdzan
                                  ? KomplekkuColors.primary
                                  : KomplekkuColors.surfaceSoft,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isNext || isActiveAdzan
                                    ? KomplekkuColors.primary
                                    : KomplekkuColors.border,
                              ),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  prayerLabels[pName]!,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isActiveAdzan
                                        ? Colors.white
                                        : KomplekkuColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  formatTime24(times[pName]!),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isActiveAdzan
                                        ? Colors.white
                                        : KomplekkuColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      })
                      .toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.label,
    required this.icon,
    required this.background,
    required this.foreground,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final Color background;
  final Color foreground;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 15, color: foreground),
      label: Text(label),
      style: TextButton.styleFrom(
        backgroundColor: background,
        foregroundColor: foreground,
        disabledBackgroundColor: background.withValues(alpha: 0.4),
        minimumSize: Size.zero,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}
