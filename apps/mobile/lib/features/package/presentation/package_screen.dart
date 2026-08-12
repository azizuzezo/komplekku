import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/package/data/package_repository.dart';
import 'package:komplekku/features/package/domain/package.dart';

const _statusLabels = {
  PackageStatus.received: 'Baru diterima',
  PackageStatus.notified: 'Menunggu diambil',
  PackageStatus.collected: 'Sudah diambil',
};

const _statusColors = {
  PackageStatus.received: KomplekkuColors.textSecondary,
  PackageStatus.notified: KomplekkuColors.terracotta,
  PackageStatus.collected: KomplekkuColors.success,
};

String _twoDigits(int value) => value.toString().padLeft(2, '0');

String _formatDateTime(DateTime value) {
  final local = value.toLocal();
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
  return '${local.day} ${months[local.month - 1]} ${local.year} · '
      '${_twoDigits(local.hour)}:${_twoDigits(local.minute)}';
}

/// Resident-facing "Paket" screen. Read-only parity with
/// `apps/web/features/package/package-list.tsx` — residents can see what
/// security has logged for their house, but collection is a security-only
/// action performed on the web/security console, not here.
class PackageScreen extends ConsumerWidget {
  const PackageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final packages = ref.watch(packageListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Paket')),
      body: SafeArea(
        child: packages.when(
          loading: () => const _PackageListSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat paket masuk rumahmu.',
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
                  ? 'Paket belum dapat diakses'
                  : 'Paket belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(packageListProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const StatePanel(
                icon: Icons.inventory_2_outlined,
                title: 'Belum ada paket',
                message:
                    'Paket yang diterima satpam untuk rumahmu akan muncul di sini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(packageListProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
                itemBuilder: (context, index) => _PackageCard(
                  package: items[index],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  const _PackageCard({required this.package});

  final Package package;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        package.recipientName,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        package.trackingNumber != null
                            ? '${package.courier} · ${package.trackingNumber}'
                            : package.courier,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: _statusColors[package.status]!.withValues(
                      alpha: 0.12,
                    ),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: _statusColors[package.status]!.withValues(
                        alpha: 0.4,
                      ),
                    ),
                  ),
                  child: Text(
                    _statusLabels[package.status]!,
                    style: TextStyle(
                      color: _statusColors[package.status],
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Diterima ${_formatDateTime(package.receivedAt)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (package.status == PackageStatus.collected) ...[
              const SizedBox(height: 4),
              Text(
                package.collectedAt != null
                    ? 'Diambil ${_formatDateTime(package.collectedAt!)}'
                        '${package.collectedByName != null ? ' oleh ${package.collectedByName}' : ''}'
                    : 'Sudah diambil',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PackageListSkeleton extends StatelessWidget {
  const _PackageListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat paket',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 100,
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
