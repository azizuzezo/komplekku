import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/report/data/report_repository.dart';
import 'package:komplekku/features/report/domain/report.dart';
import 'package:komplekku/features/report/presentation/report_list_screen.dart';

class ReportDetailScreen extends ConsumerStatefulWidget {
  const ReportDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<ReportDetailScreen> createState() =>
      _ReportDetailScreenState();
}

class _ReportDetailScreenState extends ConsumerState<ReportDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(reportDetailProvider(widget.id));
    final permissions = ref.watch(currentPermissionsProvider);
    final canManage = hasPermission(permissions, 'report.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Detail Laporan')),
      body: SafeArea(
        child: detail.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat laporan ini.',
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
                  ? 'Laporan ini belum dapat diakses'
                  : 'Laporan belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(reportDetailProvider(widget.id)),
            );
          },
          data: (report) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        reportCategoryLabels[report.category]!,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                    ),
                    _DetailStatusBadge(status: report.status),
                  ],
                ),
                if (report.location != null) ...[
                  const SizedBox(height: 8),
                  _FactRow(
                    icon: Icons.location_on_outlined,
                    label: 'Lokasi',
                    value: report.location!,
                  ),
                ],
                if (canManage) ...[
                  const SizedBox(height: 4),
                  _FactRow(
                    icon: Icons.person_outline,
                    label: 'Pelapor',
                    value: '${report.reporterName} · ${report.houseCode}',
                  ),
                ],
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 20),
                Text('Deskripsi', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(
                  report.description,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 24),
                Text(
                  'Riwayat status',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                ...report.updates.map(
                  (update) => _UpdateTile(update: update),
                ),
                if (canManage) ...[
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 20),
                  _UpdateForm(reportId: widget.id, currentStatus: report.status),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: KomplekkuColors.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$label: $value',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailStatusBadge extends StatelessWidget {
  const _DetailStatusBadge({required this.status});

  final ReportStatus status;

  @override
  Widget build(BuildContext context) {
    final color = statusToneColor(reportStatusTone(status));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        reportStatusLabels[status]!,
        style: TextStyle(color: color, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _UpdateTile extends StatelessWidget {
  const _UpdateTile({required this.update});

  final ReportUpdateEntry update;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _DetailStatusBadge(status: update.status),
              const SizedBox(width: 10),
              Text(
                formatReportDateTime(update.createdAt),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: KomplekkuColors.textSecondary,
                    ),
              ),
            ],
          ),
          if (update.note != null) ...[
            const SizedBox(height: 6),
            Text(update.note!, style: Theme.of(context).textTheme.bodyMedium),
          ],
          if (update.actorName != null) ...[
            const SizedBox(height: 4),
            Text(
              'Oleh ${update.actorName}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KomplekkuColors.textSecondary,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _UpdateForm extends ConsumerStatefulWidget {
  const _UpdateForm({required this.reportId, required this.currentStatus});

  final String reportId;
  final ReportStatus currentStatus;

  @override
  ConsumerState<_UpdateForm> createState() => _UpdateFormState();
}

class _UpdateFormState extends ConsumerState<_UpdateForm> {
  final _noteController = TextEditingController();
  late ReportStatus _status = widget.currentStatus;
  bool _isSubmitting = false;
  ApiException? _error;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await ref.read(reportRepositoryProvider).addUpdate(
            id: widget.reportId,
            status: _status,
            note: _noteController.text,
          );
      if (!mounted) return;
      ref.invalidate(reportDetailProvider(widget.reportId));
      ref.invalidate(reportListProvider);
      _noteController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status laporan berhasil diperbarui.')),
      );
    } catch (error) {
      setState(() {
        _error = error is ApiException
            ? error
            : ApiException.malformedResponse();
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Perbarui status laporan',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<ReportStatus>(
          initialValue: _status,
          decoration: const InputDecoration(labelText: 'Status'),
          items: ReportStatus.values
              .map(
                (status) => DropdownMenuItem(
                  value: status,
                  child: Text(reportStatusLabels[status]!),
                ),
              )
              .toList(),
          onChanged: (value) {
            if (value != null) setState(() => _status = value);
          },
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _noteController,
          decoration: const InputDecoration(
            labelText: 'Catatan (opsional)',
            helperText: 'Catatan ini akan terlihat oleh warga pelapor.',
          ),
          maxLines: 3,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(
            _error!.message,
            style: const TextStyle(color: KomplekkuColors.danger),
          ),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _isSubmitting ? null : _submit,
          child: _isSubmitting
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Simpan perubahan'),
        ),
      ],
    );
  }
}
