import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/features/invoice/presentation/format.dart';
import 'package:komplekku/features/invoice/presentation/payment_submit_controller.dart';

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
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: KomplekkuColors.success.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: KomplekkuColors.success.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            Icon(Icons.check_circle_outline, color: KomplekkuColors.success),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Bukti pembayaran terkirim. Menunggu verifikasi bendahara.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: KomplekkuColors.success,
                    ),
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
          Text('Jumlah dibayar', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 6),
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
          const SizedBox(height: 16),
          Text('Tanggal transfer', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 6),
          OutlinedButton(
            onPressed: _pickDate,
            style: OutlinedButton.styleFrom(alignment: Alignment.centerLeft),
            child: Text(formatDateOnly(_paidAtIso)),
          ),
          const SizedBox(height: 16),
          Text('Detail transfer', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 6),
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
            const SizedBox(height: 8),
            Text(
              submissionError.message,
              style: TextStyle(color: KomplekkuColors.danger),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: isSubmitting ? null : _submit,
            child: isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Kirim bukti pembayaran'),
          ),
        ],
      ),
    );
  }
}
