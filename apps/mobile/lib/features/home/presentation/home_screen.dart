import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/home/data/home_repository.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';
import 'package:komplekku/features/home/domain/home_snapshot.dart';
import 'package:komplekku/features/home/presentation/prayer_summary_card.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_error_state.dart';
import 'package:komplekku/shared/widgets/app_header.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';
import 'package:komplekku/shared/widgets/app_section_header.dart';

/// The five shortcuts on the home grid. Everything else lives in the Profil
/// tab's grouped menu — the bottom bar only has room for five destinations, so
/// the home grid is what keeps the daily tasks one tap away.
const _quickActions = [
  (
    icon: Icons.campaign_outlined,
    label: 'Pengumuman',
    route: '/pengumuman',
    permission: null,
  ),
  (
    icon: Icons.forum_outlined,
    label: 'Forum Warga',
    route: '/forum',
    permission: 'forum.read',
  ),
  (
    icon: Icons.receipt_long_outlined,
    label: 'Iuran',
    route: '/layanan/iuran',
    permission: 'invoice.read',
  ),
  (
    icon: Icons.report_outlined,
    label: 'Laporan',
    route: '/layanan/laporan',
    permission: 'report.create',
  ),
  (
    icon: Icons.event_outlined,
    label: 'Jadwal RT',
    route: '/agenda',
    permission: null,
  ),
];

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final snapshot = ref.watch(homeSnapshotProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: snapshot.when(
          loading: () => const AppLoadingState.skeleton(rows: 5),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            final mustSignIn = failure.isUnauthorized || failure.isForbidden;
            return AppErrorState(
              title: failure.isUnauthorized
                  ? 'Sesi sudah berakhir'
                  : failure.isForbidden
                  ? 'Akses beranda belum tersedia'
                  : 'Beranda belum bisa dimuat',
              message: failure.message,
              icon: mustSignIn ? Icons.lock_outline : Icons.cloud_off_outlined,
              actionLabel: mustSignIn ? 'Keluar' : 'Coba lagi',
              onRetry: mustSignIn
                  ? () => ref.read(sessionControllerProvider.notifier).signOut()
                  : () => ref.invalidate(homeSnapshotProvider),
            );
          },
          data: (data) => RefreshIndicator(
            onRefresh: () => ref.refresh(homeSnapshotProvider.future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.lg,
                AppSpacing.xxl,
              ),
              children: [
                AppHeader(
                  title: 'Selamat datang, ${data.firstName}',
                  subtitle: '${data.communityName} · ${data.houseLabel}',
                  showAccount: true,
                ),
                const SizedBox(height: AppSpacing.base),
                if (data.isCached) ...[
                  const _OfflineNotice(),
                  const SizedBox(height: AppSpacing.base),
                ],
                const PrayerSummaryCard(),
                const SizedBox(height: AppSpacing.lg),
                const _QuickActionGrid(),
                const SizedBox(height: AppSpacing.xl),
                AppSectionHeader(
                  title: 'Pengumuman Terbaru',
                  action: 'Lihat semua',
                  onAction: () => context.go('/pengumuman'),
                ),
                if (data.announcements.isEmpty)
                  const _EmptyAnnouncements()
                else
                  ...data.announcements.map(
                    (announcement) => _AnnouncementTile(
                      announcement: announcement,
                      onTap: () =>
                          context.push('/pengumuman/${announcement.id}'),
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

class _QuickActionGrid extends ConsumerWidget {
  const _QuickActionGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(currentPermissionsProvider);
    final visible = _quickActions
        .where((action) => hasPermission(permissions, action.permission))
        .toList(growable: false);
    if (visible.isEmpty) return const SizedBox.shrink();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final action in visible)
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(AppRadius.medium),
              onTap: () => context.push(action.route),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
                child: Column(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(AppRadius.medium),
                      ),
                      child: Icon(
                        action.icon,
                        color: AppColors.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    SizedBox(
                      width: 66,
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(action.label, maxLines: 1, style: AppTypography.caption),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  const _AnnouncementTile({required this.announcement, required this.onTap});

  final HomeAnnouncement announcement;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        onTap: onTap,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HomeCover(
              url: announcement.coverImageUrl,
              badge: announcement.badge,
              isRead: announcement.isRead,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          announcement.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      _homeBadge(announcement.badge),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatPublishedAt(announcement.publishedAt),
                    style: AppTypography.tabular(AppTypography.caption),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    announcement.summary,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.body,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

const _homeBadgeIcons = {
  AnnouncementBadge.important: Icons.campaign_outlined,
  AnnouncementBadge.event: Icons.event_outlined,
  AnnouncementBadge.info: Icons.info_outline,
};

AppBadgeTone _homeBadgeTone(AnnouncementBadge badge) => switch (badge) {
  AnnouncementBadge.important => AppBadgeTone.danger,
  AnnouncementBadge.event => AppBadgeTone.brand,
  AnnouncementBadge.info => AppBadgeTone.neutral,
};

Widget _homeBadge(AnnouncementBadge badge) =>
    AppBadge(label: announcementBadgeLabels[badge]!, tone: _homeBadgeTone(badge));

class _HomeCover extends StatelessWidget {
  const _HomeCover({
    required this.url,
    required this.badge,
    required this.isRead,
  });

  final String? url;
  final AnnouncementBadge badge;
  final bool isRead;

  @override
  Widget build(BuildContext context) {
    final coverUrl = url;
    final placeholder = ColoredBox(
      color: AppColors.surfaceMuted,
      child: Center(
        child: Icon(
          _homeBadgeIcons[badge],
          color: AppColors.primary,
          semanticLabel: isRead ? 'Sudah dibaca' : 'Belum dibaca',
        ),
      ),
    );

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.small),
      child: SizedBox(
        width: 52,
        height: 52,
        child: coverUrl == null
            ? placeholder
            : Image.network(
                coverUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => placeholder,
              ),
      ),
    );
  }
}

class _OfflineNotice extends StatelessWidget {
  const _OfflineNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(AppRadius.small),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.cloud_off_outlined, size: 20, color: AppColors.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'Kamu sedang offline. Data yang tampil adalah salinan terakhir.',
              style: AppTypography.body,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyAnnouncements extends StatelessWidget {
  const _EmptyAnnouncements();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.base),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        'Belum ada pengumuman baru dari pengurus.',
        style: AppTypography.body,
      ),
    );
  }
}

String _formatPublishedAt(DateTime value) {
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
  return '${local.day} ${months[local.month - 1]} ${local.year} · $hour:$minute WIB';
}
