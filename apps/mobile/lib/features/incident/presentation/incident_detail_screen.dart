import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/incident/data/incident_repository.dart';
import 'package:komplekku/features/incident/domain/incident.dart';
import 'package:komplekku/features/incident/presentation/incident_list_screen.dart'
    show formatIncidentDateTime;
import 'package:komplekku/features/incident/presentation/incident_update_controller.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';

/// Detail view for a single incident report, mirroring
/// `apps/web/features/incident/incident-detail.tsx`. Accounts with
/// `incident.manage` additionally get an inline form to change the status
/// and record the action taken.
class IncidentDetailScreen extends ConsumerWidget {
  const IncidentDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(incidentDetailProvider(id));
    final canManage =
        hasPermission(ref.watch(currentPermissionsProvider), 'incident.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Laporan kejadian')),
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
                  : () => ref.invalidate(incidentDetailProvider(id)),
            );
          },
          data: (incident) => SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  incident.category.label,
                  style: AppTypography.caption.copyWith(letterSpacing: 0.3),
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(incident.title, style: AppTypography.heading),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _StatusBadge(status: incident.status),
                  ],
                ),
                const SizedBox(height: AppSpacing.base),
                _FactRow(
                  icon: Icons.calendar_today_outlined,
                  label: 'Waktu kejadian',
                  value: formatIncidentDateTime(incident.occurredAt),
                ),
                if (incident.location != null)
                  _FactRow(
                    icon: Icons.location_on_outlined,
                    label: 'Lokasi',
                    value: incident.location!,
                  ),
                _FactRow(
                  icon: Icons.person_outline,
                  label: 'Pelapor',
                  value: incident.reporterName,
                ),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.lg),
                Text('Deskripsi', style: AppTypography.title),
                const SizedBox(height: AppSpacing.sm),
                Text(incident.description, style: AppTypography.bodyLarge),
                if (incident.peopleInvolved != null) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Text('Pihak yang terlibat', style: AppTypography.title),
                  const SizedBox(height: AppSpacing.sm),
                  Text(incident.peopleInvolved!, style: AppTypography.bodyLarge),
                ],
                if (incident.actionTaken != null) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Text('Tindakan yang diambil', style: AppTypography.title),
                  const SizedBox(height: AppSpacing.sm),
                  Text(incident.actionTaken!, style: AppTypography.bodyLarge),
                ],
                if (canManage) ...[
                  const SizedBox(height: AppSpacing.xl),
                  const Divider(),
                  const SizedBox(height: AppSpacing.lg),
                  _UpdatePanel(incidentId: id, incident: incident),
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
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text.rich(
              TextSpan(
                style: AppTypography.body,
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

AppBadgeTone _incidentStatusTone(IncidentStatus status) => switch (status) {
  IncidentStatus.open => AppBadgeTone.danger,
  IncidentStatus.inReview => AppBadgeTone.warning,
  IncidentStatus.resolved => AppBadgeTone.success,
  IncidentStatus.closed => AppBadgeTone.neutral,
};

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final IncidentStatus status;

  @override
  Widget build(BuildContext context) {
    return AppBadge(label: status.label, tone: _incidentStatusTone(status));
  }
}

class _UpdatePanel extends ConsumerStatefulWidget {
  const _UpdatePanel({required this.incidentId, required this.incident});

  final String incidentId;
  final IncidentDetail incident;

  @override
  ConsumerState<_UpdatePanel> createState() => _UpdatePanelState();
}

class _UpdatePanelState extends ConsumerState<_UpdatePanel> {
  late IncidentStatus _status;
  late TextEditingController _actionController;

  @override
  void initState() {
    super.initState();
    _status = widget.incident.status;
    _actionController =
        TextEditingController(text: widget.incident.actionTaken ?? '');
  }

  @override
  void dispose() {
    _actionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final updated =
        await ref.read(incidentUpdateControllerProvider.notifier).submit(
              incidentId: widget.incidentId,
              status: _status,
              actionTaken: _actionController.text,
            );
    if (updated != null) {
      ref.invalidate(incidentDetailProvider(widget.incidentId));
      ref.invalidate(incidentListProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final updateState =
        ref.watch(incidentUpdateControllerProvider).value ??
            const IncidentUpdateState();
    final justSucceeded = updateState.updatedIncident != null &&
        !updateState.isSubmitting &&
        updateState.submissionError == null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Perbarui laporan', style: AppTypography.title),
        const SizedBox(height: AppSpacing.base),
        DropdownButtonFormField<IncidentStatus>(
          key: const ValueKey('incident-update-status'),
          initialValue: _status,
          decoration: const InputDecoration(labelText: 'Status'),
          items: IncidentStatus.values
              .map(
                (status) => DropdownMenuItem(
                  value: status,
                  child: Text(status.label),
                ),
              )
              .toList(growable: false),
          onChanged: updateState.isSubmitting
              ? null
              : (value) {
                  if (value != null) setState(() => _status = value);
                },
        ),
        const SizedBox(height: AppSpacing.base),
        TextFormField(
          key: const ValueKey('incident-update-action'),
          controller: _actionController,
          enabled: !updateState.isSubmitting,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Tindakan yang diambil',
            helperText: 'Catat tindakan pengurus atau petugas keamanan.',
          ),
        ),
        if (updateState.submissionError != null) ...[
          const SizedBox(height: AppSpacing.md),
          Semantics(
            liveRegion: true,
            child: Text(
              updateState.submissionError!.message,
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
          ),
        ],
        if (justSucceeded) ...[
          const SizedBox(height: AppSpacing.md),
          Text(
            'Laporan berhasil diperbarui.',
            style: AppTypography.body.copyWith(
              color: AppColors.success,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        AppButton(
          key: const ValueKey('submit-incident-update'),
          label: updateState.isSubmitting ? 'Menyimpan…' : 'Simpan perubahan',
          isLoading: updateState.isSubmitting,
          onPressed: updateState.isSubmitting ? null : _submit,
        ),
      ],
    );
  }
}
