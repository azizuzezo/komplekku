import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/home/data/home_repository.dart';
import 'package:komplekku/features/home/domain/home_snapshot.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final snapshot = ref.watch(homeSnapshotProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: KomplekkuColors.background,
        title: const Text('Komplekku'),
      ),
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
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
              children: [
                if (data.isCached) ...[
                  const _OfflineNotice(),
                  const SizedBox(height: 20),
                ],
                Text(
                  'Selamat datang, ${data.firstName}',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  '${data.communityName} · ${data.houseLabel}',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Pengumuman terbaru',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    TextButton(
                      onPressed: () => context.go('/aktivitas/pengumuman'),
                      child: const Text('Lihat semua'),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                if (data.announcements.isEmpty)
                  const _EmptyAnnouncements()
                else
                  ...data.announcements.map(
                    (announcement) => _AnnouncementTile(
                      announcement: announcement,
                      onTap: () =>
                          context.push('/aktivitas/pengumuman/${announcement.id}'),
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

class _AnnouncementTile extends StatelessWidget {
  const _AnnouncementTile({required this.announcement, required this.onTap});

  final HomeAnnouncement announcement;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
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
                      Text(
                        announcement.title,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        announcement.summary,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _formatPublishedAt(announcement.publishedAt),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: KomplekkuColors.textSecondary,
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                      ),
                    ],
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
              'Anda sedang offline. Menampilkan data terakhir yang tersedia.',
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
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Text(
          'Belum ada pengumuman. Informasi lingkungan terbaru akan muncul di sini.',
        ),
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
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight:
                constraints.maxHeight > 48 ? constraints.maxHeight - 48 : 0.0,
          ),
          child: Center(
            child: Semantics(
              liveRegion: true,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 32),
                  const SizedBox(height: 12),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(message, textAlign: TextAlign.center),
                  const SizedBox(height: 20),
                  FilledButton(onPressed: onAction, child: Text(actionLabel)),
                ],
              ),
            ),
          ),
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
  return '${local.day} ${months[local.month - 1]} ${local.year} · $hour:$minute';
}

class _HomeSkeleton extends StatelessWidget {
  const _HomeSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat beranda',
      liveRegion: true,
      child: ExcludeSemantics(
        child: ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: 4,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) => Container(
            height: index == 0 ? 72 : 110,
            decoration: const BoxDecoration(
              color: KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ),
        ),
      ),
    );
  }
}
