import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/account/data/account_repository.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/incident/data/incident_repository.dart';
import 'package:komplekku/features/incident/domain/incident.dart';
import 'package:komplekku/features/incident/presentation/incident_create_controller.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_bottom_sheet.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

/// List of incident reports ("Laporan kejadian"), mirroring
/// `apps/web/features/incident/incident-list.tsx`. This screen is
/// dual-mode: accounts with `incident.manage` see every report filed in the
/// community (with a status filter), while accounts that only have
/// `incident.create`/`incident.read` (residents, security without the
/// elevated permission) see only the reports they filed themselves. The API
/// has no "mine only" query parameter, so the own-reports view is filtered
/// client-side by matching `reporterName` against the signed-in account's
/// display name.
class IncidentListScreen extends ConsumerStatefulWidget {
  const IncidentListScreen({super.key});

  @override
  ConsumerState<IncidentListScreen> createState() =>
      _IncidentListScreenState();
}

class _IncidentListScreenState extends ConsumerState<IncidentListScreen> {
  IncidentStatus? _statusFilter;

  @override
  Widget build(BuildContext context) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canRead = hasPermission(permissions, 'incident.read');
    final canCreate = hasPermission(permissions, 'incident.create');
    final canManage = hasPermission(permissions, 'incident.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Laporan kejadian')),
      floatingActionButton: canRead && canCreate
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateSheet(context),
              icon: const Icon(Icons.add),
              label: const Text('Buat laporan'),
            )
          : null,
      body: SafeArea(
        child: !canRead
            ? StatePanel(
                icon: Icons.block_outlined,
                title: 'Laporan kejadian tidak dapat diakses',
                message: canCreate
                    ? 'Akunmu dapat membuat laporan, tetapi belum memiliki izin untuk melihat daftar laporan.'
                    : 'Akunmu tidak memiliki izin untuk melihat laporan kejadian.',
                actionLabel: canCreate ? 'Buat laporan' : null,
                onAction: canCreate ? () => _openCreateSheet(context) : null,
              )
            : _IncidentList(
                canManage: canManage,
                statusFilter: _statusFilter,
                onStatusFilterChanged: (value) =>
                    setState(() => _statusFilter = value),
              ),
      ),
    );
  }

  void _openCreateSheet(BuildContext context) {
    showAppBottomSheet<void>(
      context: context,
      builder: (context) => const _CreateIncidentSheet(),
    );
  }
}

class _IncidentList extends ConsumerWidget {
  const _IncidentList({
    required this.canManage,
    required this.statusFilter,
    required this.onStatusFilterChanged,
  });

  final bool canManage;
  final IncidentStatus? statusFilter;
  final ValueChanged<IncidentStatus?> onStatusFilterChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final incidents = ref.watch(incidentListProvider);

    return incidents.when(
      loading: () => const _IncidentListSkeleton(),
      error: (error, _) {
        final failure =
            error is ApiException ? error : ApiException.malformedResponse();
        if (failure.isUnauthorized) {
          return StatePanel(
            icon: Icons.lock_outline,
            title: 'Sesi sudah berakhir',
            message: 'Masuk kembali untuk melihat laporan kejadian.',
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
              ? 'Laporan kejadian tidak dapat diakses'
              : 'Laporan belum bisa dimuat',
          message: failure.message,
          actionLabel: failure.isForbidden ? null : 'Coba lagi',
          onAction: failure.isForbidden
              ? null
              : () => ref.invalidate(incidentListProvider),
        );
      },
      data: (items) {
        final visible = _visibleItems(ref, items);
        return RefreshIndicator(
          onRefresh: () => ref.refresh(incidentListProvider.future),
          child: Column(
            children: [
              if (canManage)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.base,
                    AppSpacing.md,
                    AppSpacing.base,
                    0,
                  ),
                  child: _StatusFilterBar(
                    value: statusFilter,
                    onChanged: onStatusFilterChanged,
                  ),
                ),
              Expanded(
                child: visible.isEmpty
                    ? StatePanel(
                        icon: Icons.report_gmailerrorred_outlined,
                        title: 'Belum ada laporan kejadian',
                        message: canManage
                            ? 'Laporan yang dibuat akan muncul di daftar ini.'
                            : 'Laporan yang kamu buat akan muncul di sini.',
                      )
                    : ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(
                          AppSpacing.base,
                          AppSpacing.md,
                          AppSpacing.base,
                          AppSpacing.xl,
                        ),
                        itemCount: visible.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: AppSpacing.sm),
                        itemBuilder: (context, index) {
                          final item = visible[index];
                          return _IncidentCard(
                            incident: item,
                            onTap: () => context
                                .push('/keamanan/kejadian/${item.id}'),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  List<IncidentSummary> _visibleItems(
    WidgetRef ref,
    List<IncidentSummary> items,
  ) {
    if (canManage) {
      final filter = statusFilter;
      if (filter == null) return items;
      return items.where((item) => item.status == filter).toList();
    }
    final displayName = ref.watch(accountSnapshotProvider).maybeWhen(
          data: (account) => account.displayName,
          orElse: () => null,
        );
    if (displayName == null) return const [];
    return items.where((item) => item.reporterName == displayName).toList();
  }
}

class _StatusFilterBar extends StatelessWidget {
  const _StatusFilterBar({required this.value, required this.onChanged});

  final IncidentStatus? value;
  final ValueChanged<IncidentStatus?> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _FilterChip(
            label: 'Semua status',
            selected: value == null,
            onTap: () => onChanged(null),
          ),
          for (final status in IncidentStatus.values)
            Padding(
              padding: const EdgeInsets.only(left: AppSpacing.sm),
              child: _FilterChip(
                label: status.label,
                selected: value == status,
                onTap: () => onChanged(status),
              ),
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary.withValues(alpha: 0.16),
    );
  }
}

class _IncidentCard extends StatelessWidget {
  const _IncidentCard({required this.incident, required this.onTap});

  final IncidentSummary incident;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  incident.title,
                  style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              _statusBadge(incident.status),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            incident.location != null
                ? '${incident.category.label} · ${incident.location}'
                : incident.category.label,
            style: AppTypography.body,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Dilaporkan oleh ${incident.reporterName} · ${formatIncidentDateTime(incident.occurredAt)}',
            style: AppTypography.caption,
          ),
        ],
      ),
    );
  }
}

AppBadgeTone _statusTone(IncidentStatus status) => switch (status) {
  IncidentStatus.open => AppBadgeTone.danger,
  IncidentStatus.inReview => AppBadgeTone.warning,
  IncidentStatus.resolved => AppBadgeTone.success,
  IncidentStatus.closed => AppBadgeTone.neutral,
};

Widget _statusBadge(IncidentStatus status) =>
    AppBadge(label: status.label, tone: _statusTone(status));

class _IncidentListSkeleton extends StatelessWidget {
  const _IncidentListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat laporan kejadian',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.base),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 96,
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
            ),
          ),
        ),
      ),
    );
  }
}

class _CreateIncidentSheet extends ConsumerStatefulWidget {
  const _CreateIncidentSheet();

  @override
  ConsumerState<_CreateIncidentSheet> createState() =>
      _CreateIncidentSheetState();
}

class _CreateIncidentSheetState extends ConsumerState<_CreateIncidentSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _peopleController = TextEditingController();
  IncidentCategory _category = IncidentCategory.security;
  DateTime _occurredAt = DateTime.now();

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _peopleController.dispose();
    super.dispose();
  }

  Future<void> _pickOccurredAt() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _occurredAt,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_occurredAt),
    );
    if (time == null) return;
    setState(() {
      _occurredAt = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _submit() async {
    final state = ref.read(incidentCreateControllerProvider).value;
    if (state == null || state.isSubmitting) return;
    if (!_formKey.currentState!.validate()) return;

    final created =
        await ref.read(incidentCreateControllerProvider.notifier).submit(
              category: _category,
              title: _titleController.text.trim(),
              description: _descriptionController.text.trim(),
              location: _locationController.text,
              occurredAt: _occurredAt,
              peopleInvolved: _peopleController.text,
            );
    if (created == null || !mounted) return;
    ref.invalidate(incidentListProvider);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final createState = ref.watch(incidentCreateControllerProvider).value ??
        const IncidentCreateState();

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
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Buat laporan kejadian', style: AppTypography.title),
              const SizedBox(height: AppSpacing.base),
              DropdownButtonFormField<IncidentCategory>(
                key: const ValueKey('incident-category'),
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Kategori'),
                items: IncidentCategory.values
                    .map(
                      (category) => DropdownMenuItem(
                        value: category,
                        child: Text(category.label),
                      ),
                    )
                    .toList(growable: false),
                onChanged: createState.isSubmitting
                    ? null
                    : (value) {
                        if (value != null) setState(() => _category = value);
                      },
              ),
              const SizedBox(height: AppSpacing.base),
              TextFormField(
                key: const ValueKey('incident-title'),
                controller: _titleController,
                enabled: !createState.isSubmitting,
                decoration: const InputDecoration(labelText: 'Judul'),
                validator: (value) {
                  if ((value?.trim().length ?? 0) < 3) {
                    return 'Tulis judul singkat, minimal 3 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.base),
              TextFormField(
                key: const ValueKey('incident-description'),
                controller: _descriptionController,
                enabled: !createState.isSubmitting,
                maxLines: 4,
                decoration: const InputDecoration(labelText: 'Deskripsi'),
                validator: (value) {
                  if ((value?.trim().length ?? 0) < 3) {
                    return 'Jelaskan kejadian, minimal 3 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.base),
              TextFormField(
                key: const ValueKey('incident-location'),
                controller: _locationController,
                enabled: !createState.isSubmitting,
                decoration:
                    const InputDecoration(labelText: 'Lokasi (opsional)'),
              ),
              const SizedBox(height: AppSpacing.base),
              InkWell(
                onTap: createState.isSubmitting ? null : _pickOccurredAt,
                child: InputDecorator(
                  decoration: const InputDecoration(labelText: 'Waktu kejadian'),
                  child: Text(formatIncidentDateTime(_occurredAt)),
                ),
              ),
              const SizedBox(height: AppSpacing.base),
              TextFormField(
                key: const ValueKey('incident-people'),
                controller: _peopleController,
                enabled: !createState.isSubmitting,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Pihak yang terlibat (opsional)',
                ),
              ),
              if (createState.submissionError != null) ...[
                const SizedBox(height: AppSpacing.md),
                Semantics(
                  liveRegion: true,
                  child: Text(
                    createState.submissionError!.message,
                    style: AppTypography.body.copyWith(color: AppColors.danger),
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              AppButton(
                key: const ValueKey('submit-incident'),
                label: createState.isSubmitting ? 'Mengirim…' : 'Kirim laporan',
                isLoading: createState.isSubmitting,
                onPressed: createState.isSubmitting ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String formatIncidentDateTime(DateTime value) {
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
