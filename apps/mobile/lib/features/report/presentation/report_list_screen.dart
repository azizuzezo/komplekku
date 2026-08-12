import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/report/data/report_repository.dart';
import 'package:komplekku/features/report/domain/report.dart';
import 'package:komplekku/features/report/presentation/report_form_controller.dart';

/// Resident + staff dual-mode screen for "Lapor Masalah". Residents see their
/// own reports and can submit new ones (`report.create`); staff holding
/// `report.manage` see every household's reports via the same `GET /reports`
/// call, which the API already scopes server-side.
class ReportListScreen extends ConsumerWidget {
  const ReportListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canCreate = hasPermission(permissions, 'report.create');
    final canManage = hasPermission(permissions, 'report.manage');
    final reports = ref.watch(reportListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Lapor Masalah')),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateSheet(context),
              icon: const Icon(Icons.add),
              label: const Text('Buat laporan'),
            )
          : null,
      body: SafeArea(
        child: reports.when(
          loading: () => const _ReportListSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat laporan.',
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
                  ? 'Laporan belum dapat diakses'
                  : 'Laporan belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(reportListProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return StatePanel(
                icon: Icons.report_problem_outlined,
                title: 'Belum ada laporan',
                message: canManage
                    ? 'Laporan yang dikirim warga akan muncul di sini.'
                    : 'Laporan yang kamu kirim akan muncul di sini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(reportListProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return _ReportCard(
                    report: item,
                    showReporter: canManage,
                    onTap: () =>
                        context.push('/layanan/laporan/${item.id}'),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }

  void _openCreateSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => const _ReportCreateSheet(),
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({
    required this.report,
    required this.showReporter,
    required this.onTap,
  });

  final ReportSummary report;
  final bool showReporter;
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
                Icons.report_problem_outlined,
                color: KomplekkuColors.primary,
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
                            reportCategoryLabels[report.category]!,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                        _StatusBadge(status: report.status),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      report.location != null
                          ? '${report.description} · ${report.location}'
                          : report.description,
                      style: Theme.of(context).textTheme.bodyMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      showReporter
                          ? '${report.reporterName} · ${report.houseCode} · ${formatReportDateTime(report.createdAt)}'
                          : formatReportDateTime(report.createdAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: KomplekkuColors.textSecondary,
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final ReportStatus status;

  @override
  Widget build(BuildContext context) {
    final color = statusToneColor(reportStatusTone(status));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        reportStatusLabels[status]!,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// Shared status-color mapping so list rows and the detail screen render the
/// same status badge tones.
Color statusToneColor(ReportStatusTone tone) {
  switch (tone) {
    case ReportStatusTone.success:
      return KomplekkuColors.success;
    case ReportStatusTone.warning:
      return KomplekkuColors.terracotta;
    case ReportStatusTone.muted:
      return KomplekkuColors.textSecondary;
  }
}

class _ReportListSkeleton extends StatelessWidget {
  const _ReportListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat laporan',
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

class _ReportCreateSheet extends ConsumerStatefulWidget {
  const _ReportCreateSheet();

  @override
  ConsumerState<_ReportCreateSheet> createState() =>
      _ReportCreateSheetState();
}

class _ReportCreateSheetState extends ConsumerState<_ReportCreateSheet> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  ReportCategory _category = ReportCategory.streetLight;

  @override
  void dispose() {
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final report = await ref.read(reportFormControllerProvider.notifier).submit(
          category: _category,
          description: _descriptionController.text,
          location: _locationController.text,
        );
    if (report != null && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Laporan berhasil dikirim.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final formState = ref.watch(reportFormControllerProvider);
    final isSubmitting = formState.value?.isSubmitting ?? false;
    final submissionError = formState.value?.submissionError;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Buat laporan baru',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<ReportCategory>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Kategori'),
                items: ReportCategory.values
                    .map(
                      (category) => DropdownMenuItem(
                        value: category,
                        child: Text(reportCategoryLabels[category]!),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _category = value);
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Deskripsi'),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.trim().length < 3) {
                    return 'Jelaskan masalahnya, minimal 3 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Lokasi (opsional)',
                ),
              ),
              if (submissionError != null) ...[
                const SizedBox(height: 12),
                Text(
                  submissionError.message,
                  style: const TextStyle(color: KomplekkuColors.danger),
                ),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Kirim laporan'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String formatReportDateTime(DateTime value) {
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
