import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/incident/data/incident_repository.dart';
import 'package:komplekku/features/incident/domain/incident.dart';
import 'package:komplekku/features/incident/presentation/incident_list_screen.dart'
    show formatIncidentDateTime;
import 'package:komplekku/features/incident/presentation/incident_update_controller.dart';

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
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  incident.category.label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: KomplekkuColors.textSecondary,
                        letterSpacing: 0.3,
                      ),
                ),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        incident.title,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _StatusPill(status: incident.status),
                  ],
                ),
                const SizedBox(height: 16),
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
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 20),
                Text('Deskripsi', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(
                  incident.description,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                if (incident.peopleInvolved != null) ...[
                  const SizedBox(height: 20),
                  Text(
                    'Pihak yang terlibat',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    incident.peopleInvolved!,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
                if (incident.actionTaken != null) ...[
                  const SizedBox(height: 20),
                  Text(
                    'Tindakan yang diambil',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    incident.actionTaken!,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
                if (canManage) ...[
                  const SizedBox(height: 28),
                  const Divider(),
                  const SizedBox(height: 20),
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
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: KomplekkuColors.textSecondary),
          const SizedBox(width: 10),
          Expanded(
            child: Text.rich(
              TextSpan(
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

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final IncidentStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      IncidentStatus.open => KomplekkuColors.danger,
      IncidentStatus.inReview => KomplekkuColors.accent,
      IncidentStatus.resolved => KomplekkuColors.success,
      IncidentStatus.closed => KomplekkuColors.textSecondary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        status.label,
        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12),
      ),
    );
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
        Text('Perbarui laporan', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
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
        const SizedBox(height: 16),
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
          const SizedBox(height: 14),
          Semantics(
            liveRegion: true,
            child: Text(
              updateState.submissionError!.message,
              style: const TextStyle(color: KomplekkuColors.danger),
            ),
          ),
        ],
        if (justSucceeded) ...[
          const SizedBox(height: 14),
          const Text(
            'Laporan berhasil diperbarui.',
            style: TextStyle(
              color: KomplekkuColors.success,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
        const SizedBox(height: 20),
        FilledButton(
          key: const ValueKey('submit-incident-update'),
          onPressed: updateState.isSubmitting ? null : _submit,
          child: Text(
            updateState.isSubmitting ? 'Menyimpan…' : 'Simpan perubahan',
          ),
        ),
      ],
    );
  }
}
