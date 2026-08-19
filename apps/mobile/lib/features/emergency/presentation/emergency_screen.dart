import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/emergency/domain/emergency.dart';
import 'package:komplekku/features/emergency/presentation/emergency_controller.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

const _kindOptions = [
  (EmergencyKind.security, 'Keamanan'),
  (EmergencyKind.medical, 'Medis'),
  (EmergencyKind.fire, 'Kebakaran'),
  (EmergencyKind.environmental, 'Lingkungan'),
  (EmergencyKind.other, 'Lainnya'),
];

const _statusLabels = {
  EmergencyStatus.sent: 'Terkirim',
  EmergencyStatus.acknowledged: 'Diterima petugas',
  EmergencyStatus.responding: 'Petugas menuju lokasi',
  EmergencyStatus.resolved: 'Selesai ditangani',
};

String _twoDigits(int value) => value.toString().padLeft(2, '0');

String _formatSentAt(DateTime value) {
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

/// Resident-facing "Darurat" (SOS) screen. Mirrors
/// `apps/web/features/emergency/emergency-sos-panel.tsx`: a single-purpose
/// panel to pick an emergency kind, add an optional note, and send it —
/// there is no history list here on the resident side (that view belongs to
/// security's triage console).
class EmergencyScreen extends ConsumerWidget {
  const EmergencyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emergencyState = ref.watch(emergencyControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Darurat')),
      body: SafeArea(
        child: emergencyState.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => StatePanel(
            icon: Icons.cloud_off_outlined,
            title: 'Sinyal darurat belum bisa disiapkan',
            message: (error is ApiException
                    ? error
                    : ApiException.malformedResponse())
                .message,
            actionLabel: 'Coba lagi',
            onAction: () => ref.invalidate(emergencyControllerProvider),
          ),
          data: (state) {
            if (state.submissionError?.isForbidden ?? false) {
              return StatePanel(
                icon: Icons.block_outlined,
                title: 'Sinyal darurat tidak dapat diakses',
                message: state.submissionError!.message,
              );
            }
            if (state.submissionError?.isUnauthorized ?? false) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk mengirim sinyal darurat.',
                actionLabel: 'Keluar',
                onAction: () =>
                    ref.read(sessionControllerProvider.notifier).signOut(),
              );
            }
            if (state.sentEmergency != null) {
              return _EmergencyConfirmation(emergency: state.sentEmergency!);
            }
            return _EmergencyForm(state: state);
          },
        ),
      ),
    );
  }
}

class _EmergencyForm extends ConsumerStatefulWidget {
  const _EmergencyForm({required this.state});

  final EmergencyState state;

  @override
  ConsumerState<_EmergencyForm> createState() => _EmergencyFormState();
}

class _EmergencyFormState extends ConsumerState<_EmergencyForm> {
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _noteController.text = widget.state.note;
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.base,
        AppSpacing.md,
        AppSpacing.base,
        AppSpacing.xl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Kirim sinyal darurat untuk memberi tahu petugas keamanan '
            'lingkungan secara instan.',
            style: AppTypography.body,
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Jenis kedaruratan',
            style: AppTypography.label,
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<EmergencyKind>(
            initialValue: state.kind,
            decoration: const InputDecoration(),
            items: _kindOptions
                .map(
                  (option) => DropdownMenuItem(
                    value: option.$1,
                    child: Text(option.$2),
                  ),
                )
                .toList(growable: false),
            onChanged: state.isSubmitting
                ? null
                : (value) {
                    if (value != null) {
                      ref
                          .read(emergencyControllerProvider.notifier)
                          .selectKind(value);
                    }
                  },
          ),
          const SizedBox(height: AppSpacing.base),
          TextFormField(
            controller: _noteController,
            enabled: !state.isSubmitting,
            maxLines: 3,
            maxLength: 500,
            onChanged: (value) =>
                ref.read(emergencyControllerProvider.notifier).updateNote(value),
            decoration: const InputDecoration(
              labelText: 'Catatan singkat (opsional)',
              hintText: 'Contoh: ada asap di dapur',
              helperText: 'Catatan membantu petugas memahami situasi lebih cepat.',
            ),
          ),
          if (state.submissionError != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Semantics(
              liveRegion: true,
              child: Text(
                state.submissionError!.message,
                style: AppTypography.body.copyWith(
                  color: AppColors.danger,
                  height: 1.4,
                ),
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: state.isSubmitting ? 'Mengirim sinyal…' : 'Kirim Sinyal Darurat',
            icon: state.isSubmitting ? null : Icons.warning_amber_rounded,
            isLoading: state.isSubmitting,
            variant: AppButtonVariant.danger,
            onPressed: state.isSubmitting
                ? null
                : () => ref.read(emergencyControllerProvider.notifier).submit(),
          ),
        ],
      ),
    );
  }
}

class _EmergencyConfirmation extends ConsumerWidget {
  const _EmergencyConfirmation({required this.emergency});

  final Emergency emergency;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.base,
        AppSpacing.md,
        AppSpacing.base,
        AppSpacing.xl,
      ),
      child: Semantics(
        liveRegion: true,
        child: AppCard(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sinyal darurat terkirim',
                style: AppTypography.title,
              ),
              const SizedBox(height: AppSpacing.md),
              _Fact(label: 'Status', value: _statusLabels[emergency.status]!),
              _Fact(label: 'Rumah', value: emergency.houseLabel),
              _Fact(
                label: 'Waktu kirim',
                value: _formatSentAt(emergency.sentAt),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text('Petugas keamanan telah diberi tahu.', style: AppTypography.body),
              const SizedBox(height: AppSpacing.base),
              AppButton(
                label: 'Kirim sinyal baru',
                variant: AppButtonVariant.secondary,
                expand: false,
                onPressed: () =>
                    ref.read(emergencyControllerProvider.notifier).sendAnother(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Text.rich(
        TextSpan(
          style: AppTypography.body,
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            TextSpan(text: value, style: AppTypography.tabular(AppTypography.body)),
          ],
        ),
      ),
    );
  }
}
