import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/visitor/data/visitor_repository.dart';
import 'package:komplekku/features/visitor/domain/visitor.dart';

final visitorInviteControllerProvider =
    AsyncNotifierProvider<VisitorInviteController, VisitorInviteState>(
  VisitorInviteController.new,
  isAutoDispose: true,
);

class VisitorInviteState {
  const VisitorInviteState({
    this.isSubmitting = false,
    this.submissionError,
    this.lastInvite,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final Visitor? lastInvite;

  VisitorInviteState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    Visitor? lastInvite,
  }) {
    return VisitorInviteState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      lastInvite: lastInvite ?? this.lastInvite,
    );
  }
}

class VisitorInviteController extends AsyncNotifier<VisitorInviteState> {
  @override
  Future<VisitorInviteState> build() async {
    return const VisitorInviteState();
  }

  Future<bool> submit({
    required String guestName,
    required String visitDate,
    String? guestPhone,
    String? expectedTime,
    String? vehicleInfo,
    String? plate,
    String? purpose,
    String? notes,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return false;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final visitor = await ref.read(visitorRepositoryProvider).create(
            guestName: guestName,
            visitDate: visitDate,
            guestPhone: guestPhone,
            expectedTime: expectedTime,
            vehicleInfo: vehicleInfo,
            plate: plate,
            purpose: purpose,
            notes: notes,
          );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          lastInvite: visitor,
        ),
      );
      ref.invalidate(visitorListProvider);
      return true;
    } catch (error) {
      final failure = error is ApiException
          ? error
          : ApiException.malformedResponse();
      state = AsyncData(
        current.copyWith(isSubmitting: false, submissionError: failure),
      );
      return false;
    }
  }

  VisitorInviteState? get _current {
    VisitorInviteState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
