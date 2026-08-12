import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/cash/data/cash_repository.dart';
import 'package:komplekku/features/cash/domain/cash_transaction.dart';

final cashEntryControllerProvider =
    AsyncNotifierProvider<CashEntryController, CashEntryState>(
  CashEntryController.new,
  isAutoDispose: true,
);

class CashEntryState {
  const CashEntryState({
    this.isSubmitting = false,
    this.submissionError,
    this.lastCreated,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final CashTransaction? lastCreated;

  CashEntryState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    CashTransaction? lastCreated,
  }) {
    return CashEntryState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      lastCreated: lastCreated ?? this.lastCreated,
    );
  }
}

/// Records a cash ledger entry, mirroring `cash-ledger-panel.tsx`'s
/// `createMutation` (used only by treasurers with `cash.manage`).
class CashEntryController extends AsyncNotifier<CashEntryState> {
  @override
  Future<CashEntryState> build() async => const CashEntryState();

  Future<CashTransaction?> submit({
    required String date,
    required String category,
    required String description,
    required int amount,
    required CashTransactionType type,
    required CashVisibility visibility,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return null;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final transaction = await ref.read(cashRepositoryProvider).create(
            date: date,
            category: category,
            description: description,
            amount: amount,
            type: type,
            visibility: visibility,
          );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          lastCreated: transaction,
        ),
      );
      return transaction;
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

  CashEntryState? get _current {
    CashEntryState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
