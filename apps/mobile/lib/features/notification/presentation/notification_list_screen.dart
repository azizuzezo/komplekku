import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/announcement/presentation/announcement_list_screen.dart'
    show formatIndonesianDateTime;
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/notification/data/notification_repository.dart';
import 'package:komplekku/features/notification/domain/app_notification.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

class NotificationListScreen extends ConsumerWidget {
  const NotificationListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationListProvider);
    final hasUnread = notifications.value?.any((item) => !item.isRead) ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi'),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: () async {
                await ref.read(notificationRepositoryProvider).markAllRead();
                ref.invalidate(notificationListProvider);
                ref.invalidate(unreadNotificationCountProvider);
              },
              child: const Text('Tandai semua'),
            ),
        ],
      ),
      body: SafeArea(
        child: notifications.when(
          loading: () => const _NotificationListSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat notifikasi.',
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
                  ? 'Notifikasi belum dapat diakses'
                  : 'Notifikasi belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(notificationListProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const StatePanel(
                icon: Icons.notifications_none_outlined,
                title: 'Belum ada notifikasi',
                message:
                    'Pembaruan yang ditujukan untuk akunmu akan muncul di sini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(notificationListProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.base,
                  AppSpacing.md,
                  AppSpacing.base,
                  AppSpacing.xl,
                ),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return _NotificationCard(
                    notification: item,
                    onTap: () async {
                      if (!item.isRead) {
                        await ref
                            .read(notificationRepositoryProvider)
                            .markRead(item.id);
                        ref.invalidate(notificationListProvider);
                        ref.invalidate(unreadNotificationCountProvider);
                      }
                      final route = item.linkedRoute;
                      if (route != null && context.mounted) {
                        context.push(route);
                      }
                    },
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

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Icon(
              notification.isRead
                  ? Icons.notifications_none_outlined
                  : Icons.notifications_active_outlined,
              color: notification.isRead
                  ? AppColors.textSecondary
                  : AppColors.primary,
              semanticLabel:
                  notification.isRead ? 'Sudah dibaca' : 'Belum dibaca',
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification.title,
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(notification.message, style: AppTypography.body),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  formatIndonesianDateTime(notification.createdAt),
                  style: AppTypography.tabular(AppTypography.caption),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationListSkeleton extends StatelessWidget {
  const _NotificationListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat notifikasi',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.base),
        itemCount: 4,
        separatorBuilder: (context, index) =>
            const SizedBox(height: AppSpacing.sm),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(AppRadius.small),
            ),
          ),
        ),
      ),
    );
  }
}
