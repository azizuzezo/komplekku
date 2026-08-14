import 'dart:async';
import 'dart:math';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/notifications/push_notification_service.dart';
import 'package:komplekku/features/prayer/data/prayer_service.dart';

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

  Future<void> _playAdzanAudio({String? prayerName}) async {
    if (_isMuted) return;
    try {
      await _audioPlayer.stop();
      await _audioPlayer.play(AssetSource('audio/adzan.mp3'));
      setState(() {
        _isPlayingAudio = true;
      });

      // Trigger local push notification banner on HP
      final name = prayerName ?? 'Sholat';
      ref.read(pushNotificationServiceProvider).showNotification(
            id: 999,
            title: '📢 Waktu Adzan $name Tiba',
            body: 'Kumandang adzan $name telah masuk. Mari persiapkan diri untuk sholat.',
          );
    } catch (_) {
      // Audio playback fallback handle
    }
  }

  Future<void> _stopAdzanAudio() async {
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

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      color: KomplekkuColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Realtime Digital Clock Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: KomplekkuColors.surfaceSoft,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.access_time, color: KomplekkuColors.primary, size: 22),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              timeString,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                                color: KomplekkuColors.textPrimary,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'WIB',
                              style: TextStyle(fontSize: 10, color: KomplekkuColors.textSecondary),
                            ),
                          ],
                        ),
                        const Text(
                          'Jadwal Sholat & Adzan GPS',
                          style: TextStyle(fontSize: 11, color: KomplekkuColors.textSecondary),
                        ),
                      ],
                    ),
                  ],
                ),
                Row(
                  children: [
                    if (_isPlayingAudio)
                      IconButton(
                        icon: const Icon(Icons.stop_circle, color: KomplekkuColors.danger, size: 22),
                        tooltip: 'Hentikan Audio Adzan',
                        onPressed: _stopAdzanAudio,
                      )
                    else
                      IconButton(
                        icon: const Icon(Icons.volume_up_outlined, color: KomplekkuColors.primary, size: 22),
                        tooltip: 'Tes Audio Adzan',
                        onPressed: () => _playAdzanAudio(prayerName: prayerLabels[nextEntry.key]),
                      ),
                    IconButton(
                      icon: Icon(_isMuted ? Icons.volume_off : Icons.volume_up, size: 20),
                      tooltip: _isMuted ? 'Unmute Adzan' : 'Mute Adzan',
                      onPressed: () {
                        setState(() {
                          _isMuted = !_isMuted;
                          if (_isMuted) _stopAdzanAudio();
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Next Prayer Countdown Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: KomplekkuColors.surfaceSoft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Menuju ${prayerLabels[nextEntry.key]}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '-${formatDurationMMSS(secondsToNext)}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      color: KomplekkuColors.primary,
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
                  borderRadius: BorderRadius.circular(8),
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
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '📢 Waktu Adzan ${prayerLabels[adzanState.activePrayer]}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: KomplekkuColors.primary,
                                  ),
                                ),
                                const Text(
                                  'Jeda Adzan ke Iqomah 5m...',
                                  style: TextStyle(fontSize: 12, color: KomplekkuColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: KomplekkuColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            ),
                            onPressed: () => _playAdzanAudio(prayerName: prayerLabels[adzanState.activePrayer]),
                            icon: const Icon(Icons.play_arrow, size: 16),
                            label: const Text('Adzan', style: TextStyle(fontSize: 11)),
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
                              crossAxisAlignment: CrossAxisAlignment.start,
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
                                  style: TextStyle(fontSize: 11, color: KomplekkuColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            formatDurationMMSS(adzanState.gapSecondsRemaining),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: KomplekkuColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (adzanState.kind == AdzanStateKind.iqomahCountdown) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
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
                                  style: TextStyle(fontSize: 11, color: KomplekkuColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            formatDurationMMSS(adzanState.iqomahSecondsRemaining),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: KomplekkuColors.danger,
                            ),
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
                PrayerName.isya
              ].map((pName) {
                final isNext = pName == nextEntry.key;
                final isActiveAdzan = adzanState.activePrayer == pName;

                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: isActiveAdzan
                          ? KomplekkuColors.primary
                          : isNext
                              ? KomplekkuColors.surfaceSoft
                              : KomplekkuColors.surfaceSoft,
                      borderRadius: BorderRadius.circular(6),
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
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

