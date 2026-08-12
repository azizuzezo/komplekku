import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/invoice/data/payment_repository.dart';

final paymentReviewControllerProvider =
    AsyncNotifierProvider<PaymentReviewController, PaymentReviewState>(
  PaymentReviewController.new,
  isAutoDispose: true,
);

class PaymentReviewState {
  const PaymentReviewState({
    this.activePaymentId,
    this.isSubmitting = false,
    this.submissionError,
  });

  /// The payment currently being verified or rejected, so the queue screen
  /// can disable only that row's action buttons while the request is
  /// in flight.
  final String? activePaymentId;
  final bool isSubmitting;
  final ApiException? submissionError;

  PaymentReviewState copyWith({
    String? activePaymentId,
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
  }) {
    return PaymentReviewState(
      activePaymentId: activePaymentId ?? this.activePaymentId,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
    );
  }
}

/// Verifies or rejects a submitted payment, mirroring
/// `payment-verification-queue.tsx`'s `verifyMutation`/`rejectMutation`.
class PaymentReviewController extends AsyncNotifier<PaymentReviewState> {
  @override
  Future<PaymentReviewState> build() async => const PaymentReviewState();

  Future<bool> verify(String paymentId) async {
    final current = _current;
    if (current == null || current.isSubmitting) return false;

    state = AsyncData(
      current.copyWith(
        activePaymentId: paymentId,
        isSubmitting: true,
        clearSubmissionError: true,
      ),
    );
    try {
      await ref.read(paymentRepositoryProvider).verify(paymentId);
      state = const AsyncData(PaymentReviewState());
      ref.invalidate(paymentQueueProvider);
      return true;
    } catch (error) {
      final failure = error is ApiException
          ? error
          : ApiException.malformedResponse();
      state = AsyncData(
        current.copyWith(
          activePaymentId: paymentId,
          isSubmitting: false,
          submissionError: failure,
        ),
      );
      return false;
    }
  }

  Future<bool> reject(String paymentId, String reason) async {
    final current = _current;
    if (current == null || current.isSubmitting) return false;

    state = AsyncData(
      current.copyWith(
        activePaymentId: paymentId,
        isSubmitting: true,
        clearSubmissionError: true,
      ),
    );
    try {
      await ref.read(paymentRepositoryProvider).reject(paymentId, reason);
      state = const AsyncData(PaymentReviewState());
      ref.invalidate(paymentQueueProvider);
      return true;
    } catch (error) {
      final failure = error is ApiException
          ? error
          : ApiException.malformedResponse();
      state = AsyncData(
        current.copyWith(
          activePaymentId: paymentId,
          isSubmitting: false,
          submissionError: failure,
        ),
      );
      return false;
    }
  }

  void clearError() {
    final current = _current;
    if (current == null) return;
    state = AsyncData(current.copyWith(clearSubmissionError: true));
  }

  PaymentReviewState? get _current {
    PaymentReviewState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
