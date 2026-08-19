import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/finance_dashboard/data/finance_dashboard_repository.dart';
import 'package:komplekku/features/finance_dashboard/presentation/format.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_section_header.dart';

/// Read-only finance summary for staff with `finance.dashboard.read`,
/// mirroring `finance-dashboard-panel.tsx`'s stat grid.
class FinanceDashboardScreen extends ConsumerWidget {
  const FinanceDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canView = hasPermission(permissions, 'finance.dashboard.read');

    if (!canView) {
      return Scaffold(
        appBar: AppBar(title: const Text('Keuangan')),
        body: const SafeArea(
          child: StatePanel(
            icon: Icons.lock_outline,
            title: 'Dasbor keuangan tidak dapat diakses',
            message: 'Akunmu tidak memiliki izin untuk melihat dasbor keuangan.',
          ),
        ),
      );
    }

    final dashboard = ref.watch(financeDashboardProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Keuangan')),
      body: SafeArea(
        child: dashboard.when(
          loading: () => const _DashboardSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk membuka dasbor keuangan.',
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
                  ? 'Dasbor keuangan tidak dapat diakses'
                  : 'Dasbor belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(financeDashboardProvider),
            );
          },
          data: (data) => RefreshIndicator(
            onRefresh: () => ref.refresh(financeDashboardProvider.future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppSpacing.base),
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: AppSpacing.md,
                  crossAxisSpacing: AppSpacing.md,
                  childAspectRatio: 1.5,
                  children: [
                    _StatCard(
                      label: 'Tagihan belum lunas',
                      value: '${data.outstandingInvoiceCount}',
                      sub: formatRupiah(data.outstandingInvoiceAmount),
                    ),
                    _StatCard(
                      label: 'Menunggu verifikasi',
                      value: '${data.pendingVerificationCount}',
                    ),
                    _StatCard(
                      label: 'Terkumpul bulan ini',
                      value: formatRupiah(data.collectedThisMonth),
                    ),
                    _StatCard(
                      label: 'Saldo kas',
                      value: formatRupiah(data.cashBalance),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xl),
                const AppSectionHeader(title: 'Alat keuangan'),
                _MenuLink(
                  label: 'Iuran',
                  icon: Icons.receipt_long_outlined,
                  onTap: () => context.push('/layanan/iuran'),
                ),
                const SizedBox(height: AppSpacing.md),
                _MenuLink(
                  label: 'Transparansi Kas',
                  icon: Icons.account_balance_wallet_outlined,
                  onTap: () => context.push('/layanan/kas'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, this.sub});

  final String label;
  final String value;
  final String? sub;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: AppTypography.caption),
          const SizedBox(height: AppSpacing.xs),
          Text(value, style: AppTypography.tabular(AppTypography.title)),
          if (sub != null) ...[
            const SizedBox(height: 2),
            Text(sub!, style: AppTypography.tabular(AppTypography.caption)),
          ],
        ],
      ),
    );
  }
}

class _MenuLink extends StatelessWidget {
  const _MenuLink({required this.label, required this.icon, required this.onTap});

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              label,
              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        ],
      ),
    );
  }
}

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat dasbor keuangan',
      liveRegion: true,
      child: ExcludeSemantics(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.base),
          child: Container(
            height: 220,
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
