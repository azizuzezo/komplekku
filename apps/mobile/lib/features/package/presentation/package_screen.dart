import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
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
          data: (items) => RefreshIndicator(
            onRefresh: () => ref.refresh(packageListProvider.future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                if (canManage) ...[
                  const _PackageCreateForm(),
                  const SizedBox(height: 20),
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
                      padding: const EdgeInsets.only(bottom: 10),
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Catat paket baru', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 14),
              Text('Kode rumah', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _houseCodeController,
                textCapitalization: TextCapitalization.characters,
                validator: (value) {
                  if ((value ?? '').trim().isEmpty) {
                    return 'Masukkan kode rumah yang valid.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Text('Nama penerima', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _recipientNameController,
                validator: (value) {
                  if ((value ?? '').trim().length < 2) {
                    return 'Masukkan nama penerima, minimal 2 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Text('Kurir', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _courierController,
                validator: (value) {
                  if ((value ?? '').trim().isEmpty) {
                    return 'Masukkan nama kurir.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Text(
                'Nomor resi (opsional)',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 6),
              TextFormField(controller: _trackingNumberController),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(_error!, style: const TextStyle(color: KomplekkuColors.danger)),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _isSaving ? null : _submit,
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Catat paket'),
              ),
            ],
          ),
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
            ] else if (widget.canManage) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _collectedByController,
                decoration: const InputDecoration(
                  isDense: true,
                  labelText: 'Nama pengambil',
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 6),
                Text(
                  _error!,
                  style: const TextStyle(color: KomplekkuColors.danger, fontSize: 12),
                ),
              ],
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.icon(
                  onPressed: _isCollecting ? null : _collect,
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: Text(_isCollecting ? 'Menyimpan...' : 'Tandai diambil'),
                  style: FilledButton.styleFrom(
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    textStyle: const TextStyle(fontSize: 12),
                  ),
                ),
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
