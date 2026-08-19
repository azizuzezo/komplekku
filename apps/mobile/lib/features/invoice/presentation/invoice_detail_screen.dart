import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/invoice/data/invoice_repository.dart';
import 'package:komplekku/features/invoice/domain/invoice.dart';
import 'package:komplekku/features/invoice/presentation/format.dart';
import 'package:komplekku/features/invoice/presentation/payment_submit_form.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';

/// Detail view for a single invoice, mirroring `invoice-detail.tsx`: shows
/// invoice facts, a receipt when paid, the waiver reason when waived, and a
/// proof-of-payment form when the invoice is still unpaid/overdue.
class InvoiceDetailScreen extends ConsumerWidget {
  const InvoiceDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(invoiceDetailProvider(id));
    final permissions = ref.watch(currentPermissionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Tagihan Iuran')),
      body: SafeArea(
        child: detail.when(
          loading: () => const AppLoadingState(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat tagihan ini.',
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
                  ? 'Tagihan ini belum dapat diakses'
                  : 'Tagihan belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(invoiceDetailProvider(id)),
            );
          },
          data: (invoice) => SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(invoice.duesTypeName, style: AppTypography.body),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Periode ${invoice.period}',
                        style: AppTypography.heading,
                      ),
                    ),
                    _StatusBadge(status: invoice.status),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                _FactRow(label: 'Jumlah', value: formatRupiah(invoice.amount)),
                _FactRow(
                  label: 'Jatuh tempo',
                  value: formatDateOnly(invoice.dueDate),
                ),
                _FactRow(label: 'Rumah', value: invoice.houseCode),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.lg),
                if (invoice.status == InvoiceStatus.waived &&
                    invoice.waivedReason != null) ...[
                  Text('Alasan pembebasan', style: AppTypography.title),
                  const SizedBox(height: AppSpacing.sm),
                  Text(invoice.waivedReason!, style: AppTypography.bodyLarge),
                ],
                if (invoice.status == InvoiceStatus.paid) ...[
                  Text('Bukti pembayaran', style: AppTypography.title),
                  const SizedBox(height: AppSpacing.md),
                  _FactRow(label: 'Status', value: 'LUNAS'),
                  _FactRow(label: 'Periode', value: invoice.period),
                  _FactRow(
                    label: 'Jumlah dibayar',
                    value: formatRupiah(invoice.amount),
                  ),
                  if (invoice.paidAt != null)
                    _FactRow(
                      label: 'Dibayar pada',
                      value: formatDateTime(invoice.paidAt!),
                    ),
                  if (invoice.receiptNumber != null)
                    _FactRow(
                      label: 'Nomor referensi',
                      value: invoice.receiptNumber!,
                    ),
                ],
                if (invoice.canSubmitPayment) ...[
                  Text('Kirim bukti pembayaran', style: AppTypography.title),
                  const SizedBox(height: AppSpacing.md),
                  if (hasPermission(permissions, 'payment.create'))
                    PaymentSubmitForm(
                      invoiceId: invoice.id,
                      defaultAmount: invoice.amount,
                      onSubmitted: () =>
                          ref.invalidate(invoiceListProvider),
                    )
                  else
                    Text(
                      'Akunmu tidak memiliki izin untuk mengirim bukti pembayaran.',
                      style: AppTypography.body,
                    ),
                ],
                if (invoice.status == InvoiceStatus.pendingVerification)
                  Text(
                    'Bukti pembayaran sudah dikirim dan sedang menunggu verifikasi bendahara.',
                    style: AppTypography.body,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: AppTypography.body),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTypography.tabular(
                AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

AppBadgeTone _invoiceStatusTone(InvoiceStatus status) {
  switch (status) {
    case InvoiceStatus.paid:
      return AppBadgeTone.success;
    case InvoiceStatus.pendingVerification:
      return AppBadgeTone.warning;
    case InvoiceStatus.overdue:
      return AppBadgeTone.danger;
    case InvoiceStatus.waived:
    case InvoiceStatus.unpaid:
      return AppBadgeTone.neutral;
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final InvoiceStatus status;

  @override
  Widget build(BuildContext context) {
    return AppBadge(
      label: invoiceStatusLabel(status),
      tone: _invoiceStatusTone(status),
    );
  }
}
