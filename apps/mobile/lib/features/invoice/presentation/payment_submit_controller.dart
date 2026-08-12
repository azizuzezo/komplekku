import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/invoice/data/payment_repository.dart';
import 'package:komplekku/features/invoice/domain/payment.dart';

final paymentSubmitControllerProvider =
    AsyncNotifierProvider<PaymentSubmitController, PaymentSubmitState>(
  PaymentSubmitController.new,
  isAutoDispose: true,
);

class PaymentSubmitState {
  const PaymentSubmitState({
    this.isSubmitting = false,
    this.submissionError,
    this.submittedPayment,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final Payment? submittedPayment;

  PaymentSubmitState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    Payment? submittedPayment,
  }) {
    return PaymentSubmitState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      submittedPayment: submittedPayment ?? this.submittedPayment,
    );
  }
}

/// Submits proof-of-payment for a single invoice, mirroring
/// `payment-submit-form.tsx`'s `createPayment` mutation.
class PaymentSubmitController extends AsyncNotifier<PaymentSubmitState> {
  @override
  Future<PaymentSubmitState> build() async => const PaymentSubmitState();

  Future<Payment?> submit({
    required String invoiceId,
    required int amount,
    required String paidAt,
    required String note,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return null;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final payment = await ref.read(paymentRepositoryProvider).create(
            invoiceId: invoiceId,
            amount: amount,
            paidAt: paidAt,
            note: note,
          );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          submittedPayment: payment,
        ),
      );
      return payment;
    } catch (error) {
      final failure = error is ApiException
          ? error
          : ApiException.malformedResponse();
      state = AsyncData(
        current.copyWith(isSubmitting: false, submissionError: failure),
      );
      return null;
    }
  }

  void reset() {
    state = const AsyncData(PaymentSubmitState());
  }

  PaymentSubmitState? get _current {
    PaymentSubmitState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
