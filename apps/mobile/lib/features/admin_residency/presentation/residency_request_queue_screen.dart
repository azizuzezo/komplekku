import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/admin_residency/data/admin_residency_repository.dart';
import 'package:komplekku/features/admin_residency/domain/admin_residency_request.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

/// Board-member "Permohonan warga" queue, mirroring
/// `apps/web/features/admin/residency-request-queue.tsx` +
/// `residency-request-review.tsx`: lists pending residency requests, each
/// with inline approve/reject review, gated by `resident.manage`.
class ResidencyRequestQueueScreen extends ConsumerWidget {
  const ResidencyRequestQueueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canManage =
        hasPermission(ref.watch(currentPermissionsProvider), 'resident.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Permohonan warga')),
      body: SafeArea(
        child: !canManage
            ? const StatePanel(
                icon: Icons.block_outlined,
                title: 'Antrean pengurus tidak dapat diakses',
                message:
                    'Akunmu tidak memiliki izin untuk meninjau permohonan warga.',
              )
            : const _QueueBody(),
      ),
    );
  }
}

class _QueueBody extends ConsumerWidget {
  const _QueueBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requests = ref.watch(adminResidencyRequestListProvider);

    return requests.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) {
        final failure =
            error is ApiException ? error : ApiException.malformedResponse();
        if (failure.isUnauthorized) {
          return StatePanel(
            icon: Icons.lock_outline,
            title: 'Sesi sudah berakhir',
            message: 'Masuk kembali untuk membuka antrean permohonan warga.',
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
              ? 'Antrean pengurus tidak dapat diakses'
              : 'Antrean belum bisa dimuat',
          message: failure.message,
          actionLabel: failure.isForbidden ? null : 'Coba lagi',
          onAction: failure.isForbidden
              ? null
              : () => ref.invalidate(adminResidencyRequestListProvider),
        );
      },
      data: (items) {
        if (items.isEmpty) {
          return const StatePanel(
            icon: Icons.inbox_outlined,
            title: 'Tidak ada permohonan menunggu',
            message: 'Permohonan tempat tinggal baru akan muncul di antrean ini.',
          );
        }
        return RefreshIndicator(
          onRefresh: () =>
              ref.refresh(adminResidencyRequestListProvider.future),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              Text(
                '${items.length} permohonan menunggu',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              for (final request in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ResidencyRequestRow(request: request),
                ),
            ],
          ),
        );
      },
    );
  }
}

enum _ReviewMode { none, approve, reject }

class _ResidencyRequestRow extends ConsumerStatefulWidget {
  const _ResidencyRequestRow({required this.request});

  final AdminResidencyRequest request;

  @override
  ConsumerState<_ResidencyRequestRow> createState() =>
      _ResidencyRequestRowState();
}

class _ResidencyRequestRowState extends ConsumerState<_ResidencyRequestRow> {
  _ReviewMode _mode = _ReviewMode.none;
  bool _isSubmitting = false;
  String? _error;
  final _reasonController = TextEditingController();

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _approve() async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await ref
          .read(adminResidencyRepositoryProvider)
          .approve(widget.request.id);
      ref.invalidate(adminResidencyRequestListProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _reject() async {
    final reason = _reasonController.text.trim();
    if (reason.length < 3) {
      setState(() => _error = 'Tulis alasan penolakan, minimal 3 karakter.');
      return;
    }
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await ref
          .read(adminResidencyRepositoryProvider)
          .reject(widget.request.id, reason: reason);
      ref.invalidate(adminResidencyRequestListProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  String _formatSubmittedAt(DateTime value) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    final local = value.toLocal();
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '${local.day} ${months[local.month - 1]} ${local.year} · $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.communityName,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        request.fullName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      Text(
                        request.userPhoneMasked,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                Text(
                  _formatSubmittedAt(request.submittedAt),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 12),
            _FactRow(label: 'Rumah', value: request.houseAddressLabel),
            _FactRow(label: 'Kode rumah', value: request.houseCode),
            _FactRow(label: 'Hubungan', value: request.relationship.label),
            const SizedBox(height: 12),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: KomplekkuColors.danger)),
              const SizedBox(height: 8),
            ],
            if (_mode == _ReviewMode.none)
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => setState(() => _mode = _ReviewMode.approve),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Setujui'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => setState(() => _mode = _ReviewMode.reject),
                      icon: const Icon(Icons.close, size: 16),
                      label: const Text('Tolak'),
                    ),
                  ),
                ],
              ),
            if (_mode == _ReviewMode.approve) ...[
              Text(
                '${request.fullName} akan dihubungkan ke ${request.houseAddressLabel}.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: _isSubmitting ? null : _approve,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Konfirmasi persetujuan'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSubmitting
                          ? null
                          : () => setState(() {
                                _mode = _ReviewMode.none;
                                _error = null;
                              }),
                      child: const Text('Batal'),
                    ),
                  ),
                ],
              ),
            ],
            if (_mode == _ReviewMode.reject) ...[
              TextField(
                controller: _reasonController,
                maxLines: 4,
                maxLength: 500,
                decoration: const InputDecoration(labelText: 'Alasan penolakan'),
              ),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: KomplekkuColors.danger,
                      ),
                      onPressed: _isSubmitting ? null : _reject,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Konfirmasi penolakan'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSubmitting
                          ? null
                          : () => setState(() {
                                _mode = _ReviewMode.none;
                                _error = null;
                              }),
                      child: const Text('Batal'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
