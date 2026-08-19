import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/package/data/package_repository.dart';
import 'package:komplekku/features/package/domain/package.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';

const _statusLabels = {
  PackageStatus.received: 'Baru diterima',
  PackageStatus.notified: 'Menunggu diambil',
  PackageStatus.collected: 'Sudah diambil',
};

AppBadgeTone _packageBadgeTone(PackageStatus status) => switch (status) {
  PackageStatus.received => AppBadgeTone.neutral,
  PackageStatus.notified => AppBadgeTone.warning,
  PackageStatus.collected => AppBadgeTone.success,
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

/// "Paket" screen, mirroring `apps/web/features/package/package-list.tsx`
/// (resident, read-only) and `package-manage-panel.tsx` (security, log +
/// collect) collapsed into one screen: everyone sees the list; only
/// `package.manage` holders also see the log-package form and the
/// "Tandai diambil" action on uncollected items.
class PackageScreen extends ConsumerWidget {
  const PackageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final packages = ref.watch(packageListProvider);
    final canManage =
        hasPermission(ref.watch(currentPermissionsProvider), 'package.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Paket')),
      body: SafeArea(
        child: packages.when(
          loading: () => const Semantics(
            label: 'Memuat paket',
            liveRegion: true,
            child: AppLoadingState.skeleton(rows: 4),
          ),
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
          data: (items) => RefreshIndicator(
            onRefresh: () => ref.refresh(packageListProvider.future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.base,
                AppSpacing.md,
                AppSpacing.base,
                AppSpacing.xl,
              ),
              children: [
                if (canManage) ...[
                  const _PackageCreateForm(),
                  const SizedBox(height: AppSpacing.lg),
                ],
                if (items.isEmpty)
                  const StatePanel(
                    icon: Icons.inventory_2_outlined,
                    title: 'Belum ada paket',
                    message:
                        'Paket yang diterima satpam untuk rumahmu akan muncul di sini.',
                  )
                else
                  for (final package in items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: _PackageCard(
                        package: package,
                        canManage: canManage,
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

class _PackageCreateForm extends ConsumerStatefulWidget {
  const _PackageCreateForm();

  @override
  ConsumerState<_PackageCreateForm> createState() => _PackageCreateFormState();
}

class _PackageCreateFormState extends ConsumerState<_PackageCreateForm> {
  final _formKey = GlobalKey<FormState>();
  final _houseCodeController = TextEditingController();
  final _recipientNameController = TextEditingController();
  final _courierController = TextEditingController();
  final _trackingNumberController = TextEditingController();
  bool _isSaving = false;
  String? _error;

  @override
  void dispose() {
    _houseCodeController.dispose();
    _recipientNameController.dispose();
    _courierController.dispose();
    _trackingNumberController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      await ref.read(packageRepositoryProvider).create(
            houseCode: _houseCodeController.text.trim(),
            recipientName: _recipientNameController.text.trim(),
            courier: _courierController.text.trim(),
            trackingNumber: _trackingNumberController.text.trim(),
          );
      _houseCodeController.clear();
      _recipientNameController.clear();
      _courierController.clear();
      _trackingNumberController.clear();
      ref.invalidate(packageListProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Catat paket baru', style: AppTypography.title),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _houseCodeController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Kode rumah'),
              validator: (value) {
                if ((value ?? '').trim().isEmpty) {
                  return 'Masukkan kode rumah yang valid.';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _recipientNameController,
              decoration: const InputDecoration(labelText: 'Nama penerima'),
              validator: (value) {
                if ((value ?? '').trim().length < 2) {
                  return 'Masukkan nama penerima, minimal 2 karakter.';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _courierController,
              decoration: const InputDecoration(labelText: 'Kurir'),
              validator: (value) {
                if ((value ?? '').trim().isEmpty) {
                  return 'Masukkan nama kurir.';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _trackingNumberController,
              decoration: const InputDecoration(
                labelText: 'Nomor resi (opsional)',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                _error!,
                style: AppTypography.body.copyWith(color: AppColors.danger),
              ),
            ],
            const SizedBox(height: AppSpacing.base),
            AppButton(
              label: 'Catat paket',
              isLoading: _isSaving,
              onPressed: _isSaving ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}

class _PackageCard extends ConsumerStatefulWidget {
  const _PackageCard({required this.package, required this.canManage});

  final Package package;
  final bool canManage;

  @override
  ConsumerState<_PackageCard> createState() => _PackageCardState();
}

class _PackageCardState extends ConsumerState<_PackageCard> {
  final _collectedByController = TextEditingController();
  bool _isCollecting = false;
  String? _error;

  @override
  void dispose() {
    _collectedByController.dispose();
    super.dispose();
  }

  Future<void> _collect() async {
    final name = _collectedByController.text.trim();
    if (name.length < 2) {
      setState(() => _error = 'Masukkan nama pengambil, minimal 2 karakter.');
      return;
    }
    setState(() {
      _isCollecting = true;
      _error = null;
    });
    try {
      await ref
          .read(packageRepositoryProvider)
          .collect(widget.package.id, collectedByName: name);
      ref.invalidate(packageListProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isCollecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final package = widget.package;
    return AppCard(
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
                      style: AppTypography.bodyLarge.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      package.trackingNumber != null
                          ? '${package.courier} · ${package.trackingNumber}'
                          : package.courier,
                      style: AppTypography.tabular(AppTypography.caption),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              AppBadge(
                label: _statusLabels[package.status]!,
                tone: _packageBadgeTone(package.status),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Diterima ${_formatDateTime(package.receivedAt)}',
            style: AppTypography.tabular(AppTypography.caption),
          ),
          if (package.status == PackageStatus.collected) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              package.collectedAt != null
                  ? 'Diambil ${_formatDateTime(package.collectedAt!)}'
                      '${package.collectedByName != null ? ' oleh ${package.collectedByName}' : ''}'
                  : 'Sudah diambil',
              style: AppTypography.tabular(AppTypography.caption),
            ),
          ] else if (widget.canManage) ...[
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _collectedByController,
              decoration: const InputDecoration(
                isDense: true,
                labelText: 'Nama pengambil',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                _error!,
                style: AppTypography.caption.copyWith(color: AppColors.danger),
              ),
            ],
            const SizedBox(height: AppSpacing.sm),
            Align(
              alignment: Alignment.centerRight,
              child: AppButton(
                label: 'Tandai diambil',
                icon: Icons.check_circle_outline,
                expand: false,
                isLoading: _isCollecting,
                onPressed: _isCollecting ? null : _collect,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
