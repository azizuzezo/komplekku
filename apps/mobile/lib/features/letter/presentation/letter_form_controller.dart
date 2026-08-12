import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/letter/data/letter_repository.dart';
import 'package:komplekku/features/letter/domain/letter.dart';

final letterFormControllerProvider =
    AsyncNotifierProvider<LetterFormController, LetterFormState>(
  LetterFormController.new,
  isAutoDispose: true,
);

class LetterFormState {
  const LetterFormState({
    this.isSubmitting = false,
    this.submissionError,
    this.createdRequest,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final LetterRequest? createdRequest;

  LetterFormState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    LetterRequest? createdRequest,
  }) {
    return LetterFormState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      createdRequest: createdRequest ?? this.createdRequest,
    );
  }
}

class LetterFormController extends AsyncNotifier<LetterFormState> {
  @override
  Future<LetterFormState> build() async {
    return const LetterFormState();
  }

  Future<LetterRequest?> submit({
    required String letterTypeId,
    required String purpose,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return null;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final request = await ref.read(letterRepositoryProvider).create(
            letterTypeId: letterTypeId,
            purpose: purpose,
          );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          createdRequest: request,
        ),
      );
      ref.invalidate(letterRequestListProvider);
      return request;
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

  LetterFormState? get _current {
    LetterFormState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
