import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/security_dashboard/data/security_dashboard_repository.dart';
import 'package:komplekku/features/security_shift/data/security_shift_repository.dart';

/// Ops summary for security staff/admins, mirroring
/// `apps/web/features/security-dashboard/security-dashboard-panel.tsx`.
class SecurityDashboardScreen extends ConsumerWidget {
  const SecurityDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canView =
        hasPermission(ref.watch(currentPermissionsProvider), 'security.dashboard.read');

    return Scaffold(
      appBar: AppBar(title: const Text('Dasbor keamanan')),
      body: SafeArea(
        child: !canView
            ? const StatePanel(
                icon: Icons.block_outlined,
                title: 'Dasbor keamanan tidak dapat diakses',
                message:
                    'Akunmu tidak memiliki izin untuk melihat dasbor keamanan.',
              )
            : const _DashboardBody(),
      ),
    );
  }
}

class _DashboardBody extends ConsumerWidget {
  const _DashboardBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(securityDashboardProvider);

    return dashboard.when(
      loading: () => const _DashboardSkeleton(),
      error: (error, _) {
        final failure =
            error is ApiException ? error : ApiException.malformedResponse();
        if (failure.isUnauthorized) {
          return StatePanel(
            icon: Icons.lock_outline,
            title: 'Sesi sudah berakhir',
            message: 'Masuk kembali untuk membuka dasbor keamanan.',
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
              ? 'Dasbor keamanan tidak dapat diakses'
              : 'Dasbor belum bisa dimuat',
          message: failure.message,
          actionLabel: failure.isForbidden ? null : 'Coba lagi',
          onAction: failure.isForbidden
              ? null
              : () => ref.invalidate(securityDashboardProvider),
        );
      },
      data: (snapshot) => RefreshIndicator(
        onRefresh: () => ref.refresh(securityDashboardProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            const _ShiftCard(),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.35,
              children: [
                _StatCard(
                  label: 'Tamu aktif',
                  value: '${snapshot.activeVisitorCount}',
                ),
                _StatCard(
                  label: 'Paket menunggu',
                  value: '${snapshot.pendingPackageCount}',
                ),
                _StatCard(
                  label: 'Kamera daring',
                  value: '${snapshot.camerasOnline}/${snapshot.camerasTotal}',
                ),
                _StatCard(
                  label: 'Darurat terbuka',
                  value: '${snapshot.openEmergencyCount}',
                  isDanger: snapshot.openEmergencyCount > 0,
                ),
                _StatCard(
                  label: 'Progres patroli',
                  value: snapshot.activePatrolSession != null
                      ? '${snapshot.activePatrolSession!.completedCheckpoints}/${snapshot.activePatrolSession!.totalCheckpoints}'
                      : 'Tidak berjalan',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ShiftCard extends ConsumerStatefulWidget {
  const _ShiftCard();

  @override
  ConsumerState<_ShiftCard> createState() => _ShiftCardState();
}

class _ShiftCardState extends ConsumerState<_ShiftCard> {
  final _notesController = TextEditingController();
  bool _isMutating = false;
  String? _error;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _refreshAfterMutation() {
    ref.invalidate(activeSecurityShiftProvider);
    ref.invalidate(securityDashboardProvider);
  }

  Future<void> _start() async {
    setState(() {
      _isMutating = true;
      _error = null;
    });
    try {
      await ref.read(securityShiftRepositoryProvider).start();
      _refreshAfterMutation();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isMutating = false);
    }
  }

  Future<void> _end() async {
    setState(() {
      _isMutating = true;
      _error = null;
    });
    try {
      await ref
          .read(securityShiftRepositoryProvider)
          .end(notes: _notesController.text);
      _notesController.clear();
      _refreshAfterMutation();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isMutating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shiftAsync = ref.watch(activeSecurityShiftProvider);
    final shift = shiftAsync.value;
    final shiftLoadError = shiftAsync.hasError
        ? (shiftAsync.error is ApiException
            ? (shiftAsync.error as ApiException).message
            : 'Status shift belum bisa dimuat.')
        : null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  shift != null
                      ? Icons.shield_outlined
                      : Icons.shield_moon_outlined,
                  color: shift != null
                      ? KomplekkuColors.success
                      : KomplekkuColors.textSecondary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Shift jaga',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        shift != null
                            ? 'Aktif sejak ${formatDashboardDateTime(shift.startedAt)}'
                            : 'Belum ada shift aktif',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      if (shift != null)
                        Text(
                          'Petugas: ${shift.officerName}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_error != null) ...[
              Text(
                _error!,
                style: const TextStyle(color: KomplekkuColors.danger),
              ),
              const SizedBox(height: 8),
            ],
            if (shiftLoadError != null)
              Text(
                shiftLoadError,
                style: const TextStyle(color: KomplekkuColors.danger),
              )
            else if (shift != null) ...[
              TextField(
                controller: _notesController,
                maxLines: 3,
                maxLength: 1000,
                decoration: const InputDecoration(
                  labelText: 'Catatan akhir shift (opsional)',
                ),
              ),
              FilledButton(
                onPressed: _isMutating ? null : _end,
                style: FilledButton.styleFrom(
                  backgroundColor: KomplekkuColors.danger,
                ),
                child: _isMutating
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Akhiri shift'),
              ),
            ] else
              FilledButton(
                onPressed: _isMutating ? null : _start,
                child: _isMutating
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Mulai shift'),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    this.isDanger = false,
  });

  final String label;
  final String value;
  final bool isDanger;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: isDanger ? KomplekkuColors.danger.withValues(alpha: 0.08) : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 24,
                    color: isDanger ? KomplekkuColors.danger : null,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat dasbor keamanan',
      liveRegion: true,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ExcludeSemantics(
            child: Container(
              height: 72,
              decoration: BoxDecoration(
                color: KomplekkuColors.surfaceSoft,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 16),
          ExcludeSemantics(
            child: GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.35,
              children: List.generate(
                4,
                (index) => Container(
                  decoration: BoxDecoration(
                    color: KomplekkuColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String formatDashboardDateTime(DateTime value) {
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
