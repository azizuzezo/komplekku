import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/announcement/data/announcement_repository.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';
import 'package:komplekku/features/announcement/presentation/announcement_list_screen.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class AnnouncementDetailScreen extends ConsumerStatefulWidget {
  const AnnouncementDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<AnnouncementDetailScreen> createState() =>
      _AnnouncementDetailScreenState();
}

class _AnnouncementDetailScreenState
    extends ConsumerState<AnnouncementDetailScreen> {
  bool _markedRead = false;

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(announcementDetailProvider(widget.id));

    ref.listen(announcementDetailProvider(widget.id), (previous, next) {
      final announcement = next.value;
      if (announcement != null && !announcement.isRead && !_markedRead) {
        _markedRead = true;
        ref.read(announcementRepositoryProvider).markRead(widget.id).catchError(
              (_) {
                // Read-state sync is best-effort; the detail content already loaded.
              },
            );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Pengumuman')),
      body: SafeArea(
        child: detail.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat pengumuman ini.',
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
                  ? 'Pengumuman ini belum dapat diakses'
                  : 'Pengumuman belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () =>
                      ref.invalidate(announcementDetailProvider(widget.id)),
            );
          },
          data: (announcement) => SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (announcement.priority != AnnouncementPriority.normal)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _PriorityLabel(priority: announcement.priority),
                  ),
                Text(
                  announcement.title,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  formatIndonesianDateTime(announcement.publishedAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: KomplekkuColors.textSecondary,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                ),
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 20),
                Text(
                  announcement.body,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PriorityLabel extends StatelessWidget {
  const _PriorityLabel({required this.priority});

  final AnnouncementPriority priority;

  @override
  Widget build(BuildContext context) {
    final isUrgent = priority == AnnouncementPriority.urgent;
    return Text(
      isUrgent ? 'MENDESAK' : 'PENTING',
      style: TextStyle(
        color: isUrgent ? KomplekkuColors.danger : KomplekkuColors.terracotta,
        fontWeight: FontWeight.w800,
        fontSize: 12,
        letterSpacing: 0.6,
      ),
    );
  }
}
