import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/patrol/data/patrol_repository.dart';
import 'package:komplekku/features/patrol/presentation/patrol_session_controller.dart';

/// The security guard's patrol-checklist execution screen, mirroring
/// `apps/web/features/patrol/patrol-panel.tsx`: start a patrol, scan
/// checkpoints one by one (manual token entry, matching the web form's
/// text input rather than an actual QR scanner), and end the patrol.
/// Accounts with `patrol.manage` additionally see the patrol history list.
class PatrolScreen extends ConsumerStatefulWidget {
  const PatrolScreen({super.key});

  @override
  ConsumerState<PatrolScreen> createState() => _PatrolScreenState();
}

class _PatrolScreenState extends ConsumerState<PatrolScreen> {
  final _qrTokenController = TextEditingController();
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _qrTokenController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _scan() async {
    final token = _qrTokenController.text.trim();
    if (token.isEmpty) return;
    await ref.read(patrolSessionControllerProvider.notifier).scan(
          qrToken: token,
          note: _noteController.text,
        );
    final failed =
        ref.read(patrolSessionControllerProvider).value?.submissionError !=
            null;
    if (!failed) {
      _qrTokenController.clear();
      _noteController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canExecute = hasPermission(permissions, 'patrol.execute');
    final canManage = hasPermission(permissions, 'patrol.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Patroli lingkungan')),
      body: SafeArea(
        child: !canExecute && !canManage
            ? const StatePanel(
                icon: Icons.block_outlined,
                title: 'Patroli tidak dapat diakses',
                message: 'Akunmu tidak memiliki izin untuk menjalankan patroli.',
              )
            : RefreshIndicator(
                onRefresh: () async {
                  if (canExecute) {
                    ref.invalidate(patrolCheckpointListProvider);
                    ref.invalidate(patrolSessionControllerProvider);
                  }
                  if (canManage) ref.invalidate(patrolHistoryProvider);
                },
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  children: [
                    if (canExecute) ..._buildExecuteSections(context),
                    if (canManage) ..._buildHistorySection(context),
                  ],
                ),
              ),
      ),
    );
  }

  List<Widget> _buildExecuteSections(BuildContext context) {
    final checkpoints = ref.watch(patrolCheckpointListProvider);
    final sessionAsync = ref.watch(patrolSessionControllerProvider);

    return [
      Text('Titik periksa', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 10),
      checkpoints.when(
        loading: () => const _SectionSkeleton(),
        error: (error, _) => _ErrorMessage(error: error),
        data: (items) {
          if (items.isEmpty) {
            return const StatePanel(
              icon: Icons.flag_outlined,
              title: 'Belum ada titik periksa',
              message: 'Titik periksa yang dikonfigurasi pengurus akan muncul di sini.',
            );
          }
          final sorted = [...items]
            ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
          return Card(
            child: Column(
              children: [
                for (final checkpoint in sorted)
                  ListTile(
                    leading: CircleAvatar(
                      radius: 14,
                      backgroundColor: AppColors.surfaceSoft,
                      child: Text(
                        '${checkpoint.displayOrder}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    title: Text(checkpoint.name),
                  ),
              ],
            ),
          );
        },
      ),
      const SizedBox(height: 24),
      Text('Sesi patroli', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 10),
      sessionAsync.when(
        loading: () => const _SectionSkeleton(),
        error: (error, _) => _ErrorMessage(error: error),
        data: (sessionState) => _SessionCard(
          sessionState: sessionState,
          qrTokenController: _qrTokenController,
          noteController: _noteController,
          onStart: () => ref.read(patrolSessionControllerProvider.notifier).start(),
          onScan: _scan,
          onEnd: () => ref.read(patrolSessionControllerProvider.notifier).end(),
        ),
      ),
    ];
  }

  List<Widget> _buildHistorySection(BuildContext context) {
    final history = ref.watch(patrolHistoryProvider);
    return [
      const SizedBox(height: 24),
      Text('Riwayat patroli', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 10),
      history.when(
        loading: () => const _SectionSkeleton(),
        error: (error, _) => _ErrorMessage(error: error),
        data: (items) {
          if (items.isEmpty) {
            return const StatePanel(
              icon: Icons.history_outlined,
              title: 'Belum ada riwayat patroli',
              message: 'Sesi patroli yang telah selesai akan muncul di sini.',
            );
          }
          return Card(
            child: Column(
              children: [
                for (final session in items)
                  ListTile(
                    title: Text(session.officerName),
                    subtitle: Text(
                      session.endedAt != null
                          ? '${formatPatrolDateTime(session.startedAt)} – ${formatPatrolDateTime(session.endedAt!)}'
                          : formatPatrolDateTime(session.startedAt),
                    ),
                    trailing: Text(
                      '${session.scans.length}/${session.totalCheckpoints}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    ];
  }
}

class _SessionCard extends StatelessWidget {
  const _SessionCard({
    required this.sessionState,
    required this.qrTokenController,
    required this.noteController,
    required this.onStart,
    required this.onScan,
    required this.onEnd,
  });

  final PatrolSessionState sessionState;
  final TextEditingController qrTokenController;
  final TextEditingController noteController;
  final VoidCallback onStart;
  final VoidCallback onScan;
  final VoidCallback onEnd;

  @override
  Widget build(BuildContext context) {
    final session = sessionState.session;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (session == null) ...[
              const Text('Belum ada patroli yang berjalan.'),
              const SizedBox(height: 14),
              if (sessionState.submissionError != null) ...[
                Text(
                  sessionState.submissionError!.message,
                  style: const TextStyle(color: AppColors.danger),
                ),
                const SizedBox(height: 10),
              ],
              FilledButton(
                key: const ValueKey('patrol-start'),
                onPressed: sessionState.isSubmitting ? null : onStart,
                child: Text(
                  sessionState.isSubmitting ? 'Memulai…' : 'Mulai patroli',
                ),
              ),
            ] else ...[
              Text(
                'Progres: ${session.scans.length}/${session.totalCheckpoints} titik periksa',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),
              TextField(
                key: const ValueKey('patrol-qr-token'),
                controller: qrTokenController,
                enabled: !sessionState.isSubmitting,
                decoration: const InputDecoration(
                  labelText: 'Token titik periksa',
                  hintText: 'checkpoint-xxxxxxxx',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                key: const ValueKey('patrol-note'),
                controller: noteController,
                enabled: !sessionState.isSubmitting,
                maxLength: 500,
                decoration: const InputDecoration(labelText: 'Catatan (opsional)'),
              ),
              if (sessionState.submissionError != null) ...[
                const SizedBox(height: 6),
                Text(
                  sessionState.submissionError!.message,
                  style: const TextStyle(color: AppColors.danger),
                ),
              ],
              const SizedBox(height: 6),
              FilledButton(
                key: const ValueKey('patrol-scan'),
                onPressed: sessionState.isSubmitting ? null : onScan,
                child: Text(
                  sessionState.isSubmitting ? 'Memindai…' : 'Pindai titik periksa',
                ),
              ),
              if (session.scans.isNotEmpty) ...[
                const SizedBox(height: 16),
                for (final scan in session.scans)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_outline,
                            size: 16, color: AppColors.success),
                        const SizedBox(width: 8),
                        Expanded(child: Text(scan.checkpointName)),
                        Text(
                          formatPatrolDateTime(scan.scannedAt),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
              ],
              const SizedBox(height: 16),
              OutlinedButton(
                key: const ValueKey('patrol-end'),
                onPressed: sessionState.isSubmitting ? null : onEnd,
                child: Text(
                  sessionState.isSubmitting ? 'Mengakhiri…' : 'Akhiri patroli',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionSkeleton extends StatelessWidget {
  const _SectionSkeleton();

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Container(
        height: 72,
        decoration: BoxDecoration(
          color: AppColors.surfaceSoft,
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}

class _ErrorMessage extends StatelessWidget {
  const _ErrorMessage({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    final failure =
        error is ApiException ? error as ApiException : ApiException.malformedResponse();
    return Consumer(
      builder: (context, ref, _) {
        if (failure.isUnauthorized) {
          return StatePanel(
            icon: Icons.lock_outline,
            title: 'Sesi sudah berakhir',
            message: 'Masuk kembali untuk membuka halaman patroli.',
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
              ? 'Data patroli tidak dapat diakses'
              : 'Data patroli belum bisa dimuat',
          message: failure.message,
        );
      },
    );
  }
}

String formatPatrolDateTime(DateTime value) {
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
