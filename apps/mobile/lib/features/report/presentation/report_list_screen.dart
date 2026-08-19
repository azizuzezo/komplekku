import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/report/data/report_repository.dart';
import 'package:komplekku/features/report/domain/report.dart';
import 'package:komplekku/features/report/presentation/report_form_controller.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_bottom_sheet.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';

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
          loading: () => const Semantics(
            label: 'Memuat laporan',
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
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.base,
                  AppSpacing.md,
                  AppSpacing.base,
                  96,
                ),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: AppSpacing.sm),
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
    showAppBottomSheet<void>(
      context: context,
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
    return AppCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.report_problem_outlined, color: AppColors.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        reportCategoryLabels[report.category]!,
                        style: AppTypography.bodyLarge.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    _reportStatusBadge(report.status),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  report.location != null
                      ? '${report.description} · ${report.location}'
                      : report.description,
                  style: AppTypography.body,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  showReporter
                      ? '${report.reporterName} · ${report.houseCode} · ${formatReportDateTime(report.createdAt)}'
                      : formatReportDateTime(report.createdAt),
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

AppBadgeTone _reportBadgeTone(ReportStatusTone tone) => switch (tone) {
  ReportStatusTone.muted => AppBadgeTone.neutral,
  ReportStatusTone.warning => AppBadgeTone.warning,
  ReportStatusTone.success => AppBadgeTone.success,
};

Widget _reportStatusBadge(ReportStatus status) => AppBadge(
  label: reportStatusLabels[status]!,
  tone: _reportBadgeTone(reportStatusTone(status)),
);

/// Shared status-color mapping so list rows and the detail screen render the
/// same status badge tones.
Color statusToneColor(ReportStatusTone tone) {
  switch (tone) {
    case ReportStatusTone.success:
      return AppColors.success;
    case ReportStatusTone.warning:
      return AppColors.accent;
    case ReportStatusTone.muted:
      return AppColors.textSecondary;
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
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.lg,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Buat laporan baru', style: AppTypography.title),
              const SizedBox(height: AppSpacing.base),
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
              const SizedBox(height: AppSpacing.md),
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
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Lokasi (opsional)',
                ),
              ),
              if (submissionError != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  submissionError.message,
                  style: AppTypography.body.copyWith(color: AppColors.danger),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              AppButton(
                label: 'Kirim laporan',
                isLoading: isSubmitting,
                onPressed: isSubmitting ? null : _submit,
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
