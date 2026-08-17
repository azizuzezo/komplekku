import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
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
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                itemCount: items.length,
                separatorBuilder: (context, index) => const SizedBox(height: 10),
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
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      invoice.duesTypeName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                  _StatusChip(status: invoice.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Periode ${invoice.period} · ${formatRupiah(invoice.amount)}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 2),
              Text(
                'Jatuh tempo ${formatDateOnly(invoice.dueDate)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: KomplekkuColors.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final InvoiceStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      InvoiceStatus.paid => KomplekkuColors.success,
      InvoiceStatus.pendingVerification => KomplekkuColors.accent,
      InvoiceStatus.overdue => KomplekkuColors.danger,
      InvoiceStatus.waived || InvoiceStatus.unpaid => KomplekkuColors.textSecondary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        invoiceStatusLabel(status),
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
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
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 96,
            decoration: BoxDecoration(
              color: KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.circular(10),
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
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                itemCount: items.length,
                separatorBuilder: (context, index) => const SizedBox(height: 10),
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
        title: const Text('Tolak pembayaran'),
        content: TextField(
          controller: reasonController,
          maxLines: 3,
          maxLength: 500,
          decoration: const InputDecoration(
            hintText: 'Alasan penolakan, minimal 3 karakter.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () {
              final value = reasonController.text.trim();
              if (value.length < 3) return;
              Navigator.of(dialogContext).pop(value);
            },
            child: const Text('Konfirmasi penolakan'),
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

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${payment.duesTypeName} · ${payment.period}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
                _PaymentStatusChip(status: payment.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              formatRupiah(payment.amount),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(
              '${payment.submittedByName} · ${payment.houseCode} · ${payment.householdDisplayName}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            Text(
              'Transfer ${formatDateOnly(payment.paidAt)}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 4),
            Text(payment.note, style: Theme.of(context).textTheme.bodyMedium),
            if (error != null) ...[
              const SizedBox(height: 8),
              Text(
                error.message,
                style: TextStyle(color: KomplekkuColors.danger),
              ),
            ],
            if (payment.status == PaymentStatus.pending) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: isSubmitting
                          ? null
                          : () => ref
                              .read(paymentReviewControllerProvider.notifier)
                              .verify(payment.id),
                      child: isSubmitting && isActive
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Verifikasi'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      onPressed:
                          isSubmitting ? null : () => _reject(context, ref),
                      child: const Text('Tolak'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PaymentStatusChip extends StatelessWidget {
  const _PaymentStatusChip({required this.status});

  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      PaymentStatus.verified => KomplekkuColors.success,
      PaymentStatus.rejected => KomplekkuColors.danger,
      PaymentStatus.pending => KomplekkuColors.accent,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        paymentStatusLabel(status),
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}
