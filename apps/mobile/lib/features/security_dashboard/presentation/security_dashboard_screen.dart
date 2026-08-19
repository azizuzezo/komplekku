import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/security_dashboard/data/security_dashboard_repository.dart';
import 'package:komplekku/features/security_shift/data/security_shift_repository.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

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
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.base,
            AppSpacing.md,
            AppSpacing.base,
            AppSpacing.xl,
          ),
          children: [
            const _ShiftCard(),
            const SizedBox(height: AppSpacing.base),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
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
                  // The count alone left petugas with nowhere to go; tapping
                  // opens the triage console that handles the signals.
                  onTap: () => context.push('/keamanan/darurat-masuk'),
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

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: shift != null
                      ? AppColors.success.withValues(alpha: 0.12)
                      : AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(AppRadius.medium),
                ),
                child: Icon(
                  shift != null
                      ? Icons.shield_outlined
                      : Icons.shield_moon_outlined,
                  color: shift != null
                      ? AppColors.success
                      : AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Shift jaga', style: AppTypography.caption),
                    const SizedBox(height: 2),
                    Text(
                      shift != null
                          ? 'Aktif sejak ${formatDashboardDateTime(shift.startedAt)}'
                          : 'Belum ada shift aktif',
                      style: AppTypography.tabular(
                        AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ),
                    if (shift != null)
                      Text(
                        'Petugas: ${shift.officerName}',
                        style: AppTypography.caption,
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (_error != null) ...[
            Text(
              _error!,
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
          if (shiftLoadError != null)
            Text(
              shiftLoadError,
              style: AppTypography.body.copyWith(color: AppColors.danger),
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
            const SizedBox(height: AppSpacing.md),
            AppButton(
              label: 'Akhiri shift',
              onPressed: _isMutating ? null : _end,
              variant: AppButtonVariant.danger,
              isLoading: _isMutating,
            ),
          ] else
            AppButton(
              label: 'Mulai shift',
              onPressed: _isMutating ? null : _start,
              isLoading: _isMutating,
            ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    this.isDanger = false,
    this.onTap,
  });

  final String label;
  final String value;
  final bool isDanger;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.all(AppSpacing.base),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: AppTypography.caption),
          const SizedBox(height: AppSpacing.xs),
          Text(
            value,
            style: AppTypography.tabular(
              AppTypography.heading.copyWith(
                fontSize: 24,
                color: isDanger ? AppColors.danger : null,
              ),
            ),
          ),
          if (onTap != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Text(
                  'Buka triase',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  size: 16,
                  color: AppColors.primary,
                ),
              ],
            ),
          ],
        ],
      ),
    );

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: isDanger ? AppColors.danger.withValues(alpha: 0.08) : AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(
          color: isDanger ? AppColors.danger.withValues(alpha: 0.35) : AppColors.border,
        ),
      ),
      child: onTap == null ? content : InkWell(onTap: onTap, child: content),
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
        padding: const EdgeInsets.all(AppSpacing.base),
        children: [
          ExcludeSemantics(
            child: Container(
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.surfaceSoft,
                borderRadius: BorderRadius.circular(AppRadius.card),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.base),
          ExcludeSemantics(
            child: GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              childAspectRatio: 1.35,
              children: List.generate(
                4,
                (index) => Container(
                  decoration: BoxDecoration(
                    color: AppColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(AppRadius.card),
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
