import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/invoice/data/invoice_repository.dart';
import 'package:komplekku/features/invoice/data/payment_repository.dart';
import 'package:komplekku/features/invoice/domain/invoice.dart';
import 'package:komplekku/features/invoice/domain/payment.dart';
import 'package:komplekku/features/invoice/presentation/format.dart';
import 'package:komplekku/features/invoice/presentation/payment_review_controller.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

/// Dual-mode Iuran screen mounted at `/layanan/iuran`.
///
/// Residents with `invoice.read` see their own bills and can drill into one
/// to pay it (`payment.create`, handled in [InvoiceDetailScreen]).
/// Treasurers/staff with `payment.verify` instead land on the pending
/// payment queue so they can verify or reject submitted proof of payment —
/// mirroring how `invoice-list.tsx` (resident) and
/// `payment-verification-queue.tsx` (treasurer) split on web, collapsed
/// into one screen per this app's mobile dual-mode pattern.
class IuranScreen extends ConsumerWidget {
  const IuranScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canVerify = hasPermission(permissions, 'payment.verify');
    final canRead = hasPermission(permissions, 'invoice.read');

    if (canVerify) return const _PaymentVerificationView();
    if (canRead) return const _InvoiceListView();

    return Scaffold(
      appBar: AppBar(title: const Text('Iuran')),
      body: const SafeArea(
        child: StatePanel(
          icon: Icons.lock_outline,
          title: 'Iuran tidak dapat diakses',
          message: 'Akunmu tidak memiliki izin untuk melihat tagihan iuran.',
        ),
      ),
    );
  }
}

class _InvoiceListView extends ConsumerWidget {
  const _InvoiceListView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoices = ref.watch(invoiceListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Iuran')),
      body: SafeArea(
        child: invoices.when(
          loading: () => const _ListSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat tagihan iuranmu.',
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
                  ? 'Tagihan iuran tidak dapat diakses'
                  : 'Tagihan belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(invoiceListProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const StatePanel(
                icon: Icons.receipt_long_outlined,
                title: 'Belum ada tagihan iuran',
                message:
                    'Tagihan iuran yang diterbitkan pengurus akan muncul di sini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(invoiceListProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.base,
                  AppSpacing.md,
                  AppSpacing.base,
                  AppSpacing.xl,
                ),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final invoice = items[index];
                  return _InvoiceCard(
                    invoice: invoice,
                    onTap: () => context.push('/layanan/iuran/${invoice.id}'),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  const _InvoiceCard({required this.invoice, required this.onTap});

  final Invoice invoice;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  invoice.duesTypeName,
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              _InvoiceStatusBadge(status: invoice.status),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Periode ${invoice.period} · ${formatRupiah(invoice.amount)}',
            style: AppTypography.tabular(AppTypography.body),
          ),
          const SizedBox(height: 2),
          Text(
            'Jatuh tempo ${formatDateOnly(invoice.dueDate)}',
            style: AppTypography.tabular(AppTypography.caption),
          ),
        ],
      ),
    );
  }
}

AppBadgeTone _invoiceStatusTone(InvoiceStatus status) => switch (status) {
  InvoiceStatus.paid => AppBadgeTone.success,
  InvoiceStatus.pendingVerification => AppBadgeTone.brand,
  InvoiceStatus.overdue => AppBadgeTone.danger,
  InvoiceStatus.waived || InvoiceStatus.unpaid => AppBadgeTone.neutral,
};

class _InvoiceStatusBadge extends StatelessWidget {
  const _InvoiceStatusBadge({required this.status});

  final InvoiceStatus status;

  @override
  Widget build(BuildContext context) {
    return AppBadge(
      label: invoiceStatusLabel(status),
      tone: _invoiceStatusTone(status),
    );
  }
}

class _ListSkeleton extends StatelessWidget {
  const _ListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat data',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.base),
        itemCount: 4,
        separatorBuilder: (context, index) =>
            const SizedBox(height: AppSpacing.sm),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 96,
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(AppRadius.small),
            ),
          ),
        ),
      ),
    );
  }
}

class _PaymentVerificationView extends ConsumerWidget {
  const _PaymentVerificationView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payments = ref.watch(paymentQueueProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Verifikasi Pembayaran')),
      body: SafeArea(
        child: payments.when(
          loading: () => const _ListSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk memverifikasi pembayaran.',
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
                  ? 'Verifikasi pembayaran tidak dapat diakses'
                  : 'Daftar pembayaran belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(paymentQueueProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const StatePanel(
                icon: Icons.task_alt_outlined,
                title: 'Tidak ada pembayaran menunggu verifikasi',
                message:
                    'Bukti pembayaran yang dikirim warga akan muncul di daftar ini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(paymentQueueProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.base,
                  AppSpacing.md,
                  AppSpacing.base,
                  AppSpacing.xl,
                ),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) => _PaymentReviewCard(
                  payment: items[index],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _PaymentReviewCard extends ConsumerWidget {
  const _PaymentReviewCard({required this.payment});

  final Payment payment;

  Future<void> _reject(BuildContext context, WidgetRef ref) async {
    final reasonController = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.modal),
        ),
        title: Text('Tolak pembayaran', style: AppTypography.title),
        content: TextField(
          controller: reasonController,
          maxLines: 3,
          maxLength: 500,
          decoration: const InputDecoration(
            hintText: 'Alasan penolakan, minimal 3 karakter.',
          ),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(
          AppSpacing.base,
          0,
          AppSpacing.base,
          AppSpacing.base,
        ),
        actions: [
          AppButton(
            label: 'Batal',
            variant: AppButtonVariant.ghost,
            expand: false,
            onPressed: () => Navigator.of(dialogContext).pop(),
          ),
          AppButton(
            label: 'Konfirmasi penolakan',
            expand: false,
            onPressed: () {
              final value = reasonController.text.trim();
              if (value.length < 3) return;
              Navigator.of(dialogContext).pop(value);
            },
          ),
        ],
      ),
    );
    reasonController.dispose();
    if (reason == null || !context.mounted) return;
    await ref.read(paymentReviewControllerProvider.notifier).reject(
          payment.id,
          reason,
        );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviewState = ref.watch(paymentReviewControllerProvider);
    final isActive = reviewState.value?.activePaymentId == payment.id;
    final isSubmitting = isActive && (reviewState.value?.isSubmitting ?? false);
    final error = isActive ? reviewState.value?.submissionError : null;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${payment.duesTypeName} · ${payment.period}',
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              _PaymentStatusBadge(status: payment.status),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            formatRupiah(payment.amount),
            style: AppTypography.tabular(
              AppTypography.title.copyWith(fontSize: 17),
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${payment.submittedByName} · ${payment.houseCode} · ${payment.householdDisplayName}',
            style: AppTypography.body,
          ),
          Text(
            'Transfer ${formatDateOnly(payment.paidAt)}',
            style: AppTypography.tabular(AppTypography.body),
          ),
          const SizedBox(height: 4),
          Text(payment.note, style: AppTypography.body),
          if (error != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              error.message,
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
          ],
          if (payment.status == PaymentStatus.pending) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Verifikasi',
                    isLoading: isSubmitting && isActive,
                    onPressed: isSubmitting
                        ? null
                        : () => ref
                            .read(paymentReviewControllerProvider.notifier)
                            .verify(payment.id),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: AppButton(
                    label: 'Tolak',
                    variant: AppButtonVariant.secondary,
                    onPressed:
                        isSubmitting ? null : () => _reject(context, ref),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

AppBadgeTone _paymentStatusTone(PaymentStatus status) => switch (status) {
  PaymentStatus.verified => AppBadgeTone.success,
  PaymentStatus.rejected => AppBadgeTone.danger,
  PaymentStatus.pending => AppBadgeTone.brand,
};

class _PaymentStatusBadge extends StatelessWidget {
  const _PaymentStatusBadge({required this.status});

  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    return AppBadge(
      label: paymentStatusLabel(status),
      tone: _paymentStatusTone(status),
    );
  }
}
