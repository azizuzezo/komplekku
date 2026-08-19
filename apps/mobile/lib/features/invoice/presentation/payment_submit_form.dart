import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/features/invoice/presentation/format.dart';
import 'package:komplekku/features/invoice/presentation/payment_submit_controller.dart';
import 'package:komplekku/shared/widgets/app_button.dart';

/// Lets a resident send proof of payment for an unpaid/overdue invoice,
/// mirroring `payment-submit-form.tsx`'s fields (amount, transfer date,
/// note) and its "sent, awaiting verification" success state.
class PaymentSubmitForm extends ConsumerStatefulWidget {
  const PaymentSubmitForm({
    super.key,
    required this.invoiceId,
    required this.defaultAmount,
    this.onSubmitted,
  });

  final String invoiceId;
  final int defaultAmount;
  final VoidCallback? onSubmitted;

  @override
  ConsumerState<PaymentSubmitForm> createState() => _PaymentSubmitFormState();
}

class _PaymentSubmitFormState extends ConsumerState<PaymentSubmitForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountController;
  final _noteController = TextEditingController();
  DateTime _paidAt = DateTime.now();
  bool _submittedOnce = false;

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController(
      text: widget.defaultAmount.toString(),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  String get _paidAtIso {
    final month = _paidAt.month.toString().padLeft(2, '0');
    final day = _paidAt.day.toString().padLeft(2, '0');
    return '${_paidAt.year}-$month-$day';
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _paidAt,
      firstDate: DateTime(now.year - 2),
      lastDate: now,
    );
    if (picked != null) {
      setState(() => _paidAt = picked);
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final amount = int.tryParse(_amountController.text.trim());
    if (amount == null) return;

    setState(() => _submittedOnce = true);
    final payment = await ref
        .read(paymentSubmitControllerProvider.notifier)
        .submit(
          invoiceId: widget.invoiceId,
          amount: amount,
          paidAt: _paidAtIso,
          note: _noteController.text.trim(),
        );
    if (payment != null) {
      widget.onSubmitted?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final submitState = ref.watch(paymentSubmitControllerProvider);
    final isSubmitting =
        submitState.value?.isSubmitting ?? submitState.isLoading;
    final submissionError = submitState.value?.submissionError;
    final submittedPayment = submitState.value?.submittedPayment;

    if (_submittedOnce && submittedPayment != null) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.input),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: AppColors.success),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                'Bukti pembayaran terkirim. Menunggu verifikasi bendahara.',
                style: AppTypography.body.copyWith(color: AppColors.success),
              ),
            ),
          ],
        ),
      );
    }

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Jumlah dibayar', style: AppTypography.body),
          const SizedBox(height: AppSpacing.xs),
          TextFormField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(prefixText: 'Rp'),
            validator: (value) {
              final parsed = int.tryParse((value ?? '').trim());
              if (parsed == null || parsed <= 0) {
                return 'Masukkan jumlah pembayaran yang valid.';
              }
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.base),
          Text('Tanggal transfer', style: AppTypography.body),
          const SizedBox(height: AppSpacing.xs),
          OutlinedButton(
            onPressed: _pickDate,
            style: OutlinedButton.styleFrom(alignment: Alignment.centerLeft),
            child: Text(formatDateOnly(_paidAtIso)),
          ),
          const SizedBox(height: AppSpacing.base),
          Text('Detail transfer', style: AppTypography.body),
          const SizedBox(height: AppSpacing.xs),
          TextFormField(
            controller: _noteController,
            maxLines: 3,
            maxLength: 300,
            decoration: const InputDecoration(
              hintText:
                  'Contoh: Transfer BCA an. Budi, 5 Agustus pukul 10.00, ref 123456.',
            ),
            validator: (value) {
              if ((value ?? '').trim().length < 3) {
                return 'Tulis detail transfer, minimal 3 karakter.';
              }
              return null;
            },
          ),
          if (submissionError != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              submissionError.message,
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
          ],
          const SizedBox(height: AppSpacing.base),
          AppButton(
            label: 'Kirim bukti pembayaran',
            isLoading: isSubmitting,
            onPressed: isSubmitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}
