import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/announcement/data/announcement_repository.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';
import 'package:komplekku/features/announcement/presentation/announcement_list_screen.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';

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
          loading: () => const AppLoadingState(),
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
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (announcement.coverImageUrl != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.base),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.medium),
                      child: Image.network(
                        announcement.coverImageUrl!,
                        width: double.infinity,
                        height: 180,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            const SizedBox.shrink(),
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _BadgeLabel(badge: announcement.badge),
                ),
                Text(announcement.title, style: AppTypography.heading),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  formatIndonesianDateTime(announcement.publishedAt),
                  style: AppTypography.tabular(AppTypography.caption),
                ),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.lg),
                Text(announcement.body, style: AppTypography.bodyLarge),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BadgeLabel extends StatelessWidget {
  const _BadgeLabel({required this.badge});

  final AnnouncementBadge badge;

  @override
  Widget build(BuildContext context) {
    final tone = switch (badge) {
      AnnouncementBadge.important => AppBadgeTone.danger,
      AnnouncementBadge.event => AppBadgeTone.brand,
      AnnouncementBadge.info => AppBadgeTone.neutral,
    };
    return AppBadge(label: announcementBadgeLabels[badge]!, tone: tone);
  }
}
