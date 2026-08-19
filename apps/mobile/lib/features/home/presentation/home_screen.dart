import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/home/data/home_repository.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';
import 'package:komplekku/features/home/domain/home_snapshot.dart';
import 'package:komplekku/features/home/presentation/prayer_summary_card.dart';

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
      backgroundColor: KomplekkuColors.background,
      body: SafeArea(
        child: snapshot.when(
          loading: () => const _HomeSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            final mustSignIn = failure.isUnauthorized || failure.isForbidden;
            return _HomeError(
              title: failure.isUnauthorized
                  ? 'Sesi sudah berakhir'
                  : failure.isForbidden
                  ? 'Akses beranda belum tersedia'
                  : 'Beranda belum bisa dimuat',
              message: failure.message,
              icon: mustSignIn ? Icons.lock_outline : Icons.cloud_off_outlined,
              actionLabel: mustSignIn ? 'Keluar' : 'Coba lagi',
              onAction: mustSignIn
                  ? () => ref.read(sessionControllerProvider.notifier).signOut()
                  : () => ref.invalidate(homeSnapshotProvider),
            );
          },
          data: (data) => RefreshIndicator(
            onRefresh: () => ref.refresh(homeSnapshotProvider.future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              children: [
                _WelcomeHeader(data: data),
                const SizedBox(height: 16),
                if (data.isCached) ...[
                  const _OfflineNotice(),
                  const SizedBox(height: 16),
                ],
                const PrayerSummaryCard(),
                const SizedBox(height: 20),
                const _QuickActionGrid(),
                const SizedBox(height: 24),
                _SectionHeader(
                  title: 'Pengumuman Terbaru',
                  onSeeAll: () => context.go('/pengumuman'),
                ),
                const SizedBox(height: 10),
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

class _WelcomeHeader extends StatelessWidget {
  const _WelcomeHeader({required this.data});

  final HomeSnapshot data;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Selamat datang, ${data.firstName}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${data.communityName} · ${data.houseLabel}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: KomplekkuColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Notifikasi',
          onPressed: () => context.push('/notifikasi'),
          icon: const Icon(Icons.notifications_none_outlined),
          style: IconButton.styleFrom(
            backgroundColor: KomplekkuColors.surfaceSoft,
          ),
        ),
        const SizedBox(width: 6),
        IconButton(
          tooltip: 'Cari pengumuman',
          onPressed: () => context.push('/pengumuman'),
          icon: const Icon(Icons.search),
          style: IconButton.styleFrom(
            backgroundColor: KomplekkuColors.surfaceSoft,
          ),
        ),
        const SizedBox(width: 6),
        IconButton(
          tooltip: 'Profil',
          onPressed: () => context.push('/akun'),
          icon: const Icon(Icons.person_outline),
          style: IconButton.styleFrom(
            backgroundColor: KomplekkuColors.surfaceSoft,
          ),
        ),
      ],
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
              borderRadius: BorderRadius.circular(12),
              onTap: () => context.push(action.route),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: KomplekkuColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        action.icon,
                        color: KomplekkuColors.primary,
                        size: 25,
                      ),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      width: 66,
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          action.label,
                          maxLines: 1,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
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

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        TextButton(
          onPressed: onSeeAll,
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Lihat semua'),
              Icon(Icons.chevron_right, size: 18),
            ],
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
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: KomplekkuColors.surface,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: KomplekkuColors.border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _HomeCover(
                  url: announcement.coverImageUrl,
                  badge: announcement.badge,
                  isRead: announcement.isRead,
                ),
                const SizedBox(width: 12),
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
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          const SizedBox(width: 6),
                          _HomeBadge(badge: announcement.badge),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatPublishedAt(announcement.publishedAt),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: KomplekkuColors.textSecondary,
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        announcement.summary,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  color: KomplekkuColors.textSecondary,
                ),
              ],
            ),
          ),
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

Color _homeBadgeColor(AnnouncementBadge badge) => switch (badge) {
  AnnouncementBadge.important => KomplekkuColors.danger,
  AnnouncementBadge.event => KomplekkuColors.primary,
  AnnouncementBadge.info => KomplekkuColors.textSecondary,
};

class _HomeBadge extends StatelessWidget {
  const _HomeBadge({required this.badge});

  final AnnouncementBadge badge;

  @override
  Widget build(BuildContext context) {
    final color = _homeBadgeColor(badge);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        announcementBadgeLabels[badge]!,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

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
      color: KomplekkuColors.surfaceMuted,
      child: Center(
        child: Icon(
          _homeBadgeIcons[badge],
          color: KomplekkuColors.primary,
          semanticLabel: isRead ? 'Sudah dibaca' : 'Belum dibaca',
        ),
      ),
    );

    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
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
      padding: const EdgeInsets.all(14),
      decoration: const BoxDecoration(
        color: KomplekkuColors.surfaceSoft,
        borderRadius: BorderRadius.all(Radius.circular(10)),
        border: Border.fromBorderSide(
          BorderSide(color: KomplekkuColors.border),
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.cloud_off_outlined, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Kamu sedang offline. Data yang tampil adalah salinan terakhir.',
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: KomplekkuColors.surfaceSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KomplekkuColors.border),
      ),
      child: Text(
        'Belum ada pengumuman baru dari pengurus.',
        style: Theme.of(context).textTheme.bodyMedium,
      ),
    );
  }
}

class _HomeError extends StatelessWidget {
  const _HomeError({
    required this.title,
    required this.message,
    required this.icon,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String message;
  final IconData icon;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Semantics(
          liveRegion: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 32, color: KomplekkuColors.textSecondary),
              const SizedBox(height: 12),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              FilledButton(onPressed: onAction, child: Text(actionLabel)),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeSkeleton extends StatelessWidget {
  const _HomeSkeleton();

  @override
  Widget build(BuildContext context) {
    Widget block(double height) => Container(
      height: height,
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: KomplekkuColors.surfaceSoft,
        borderRadius: BorderRadius.circular(12),
      ),
    );

    return Semantics(
      label: 'Memuat beranda',
      liveRegion: true,
      child: ExcludeSemantics(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [block(34), block(150), block(76), block(96), block(96)],
        ),
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
