import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/announcement/data/announcement_repository.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class AnnouncementListScreen extends ConsumerWidget {
  const AnnouncementListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final announcements = ref.watch(announcementListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Pengumuman')),
      body: SafeArea(
        child: announcements.when(
          loading: () => const _AnnouncementListSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat pengumuman.',
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
                  ? 'Pengumuman belum dapat diakses'
                  : 'Pengumuman belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(announcementListProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const StatePanel(
                icon: Icons.campaign_outlined,
                title: 'Belum ada pengumuman',
                message:
                    'Informasi lingkungan terbaru akan muncul di sini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(announcementListProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return _AnnouncementCard(
                    announcement: item,
                    onTap: () => context.push('/aktivitas/pengumuman/${item.id}'),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.announcement, required this.onTap});

  final AnnouncementSummary announcement;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                announcement.isRead
                    ? Icons.mark_email_read_outlined
                    : Icons.campaign_outlined,
                color: KomplekkuColors.primary,
                semanticLabel:
                    announcement.isRead ? 'Sudah dibaca' : 'Belum dibaca',
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (announcement.priority != AnnouncementPriority.normal)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: _PriorityBadge(priority: announcement.priority),
                      ),
                    Text(
                      announcement.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      announcement.summary,
                      style: Theme.of(context).textTheme.bodyMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      formatIndonesianDateTime(announcement.publishedAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: KomplekkuColors.textSecondary,
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PriorityBadge extends StatelessWidget {
  const _PriorityBadge({required this.priority});

  final AnnouncementPriority priority;

  @override
  Widget build(BuildContext context) {
    final isUrgent = priority == AnnouncementPriority.urgent;
    final color = isUrgent ? KomplekkuColors.danger : KomplekkuColors.terracotta;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        isUrgent ? 'Mendesak' : 'Penting',
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _AnnouncementListSkeleton extends StatelessWidget {
  const _AnnouncementListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat pengumuman',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 110,
            decoration: BoxDecoration(
              color: KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ),
    );
  }
}

String formatIndonesianDateTime(DateTime value) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  final local = value.toLocal();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '${local.day} ${months[local.month - 1]} ${local.year} · $hour:$minute';
}
