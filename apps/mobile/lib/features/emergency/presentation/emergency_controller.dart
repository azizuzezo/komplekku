import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/emergency/data/emergency_repository.dart';
import 'package:komplekku/features/emergency/domain/emergency.dart';

final emergencyControllerProvider =
    AsyncNotifierProvider<EmergencyController, EmergencyState>(
  EmergencyController.new,
  isAutoDispose: true,
);

class EmergencyState {
  const EmergencyState({
    this.kind = EmergencyKind.security,
    this.note = '',
    this.isSubmitting = false,
    this.submissionError,
    this.sentEmergency,
  });

  final EmergencyKind kind;
  final String note;
  final bool isSubmitting;
  final ApiException? submissionError;
  final Emergency? sentEmergency;

  EmergencyState copyWith({
    EmergencyKind? kind,
    String? note,
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    Emergency? sentEmergency,
    bool clearSentEmergency = false,
  }) {
    return EmergencyState(
      kind: kind ?? this.kind,
      note: note ?? this.note,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      sentEmergency:
          clearSentEmergency ? null : sentEmergency ?? this.sentEmergency,
    );
  }
}

class EmergencyController extends AsyncNotifier<EmergencyState> {
  @override
  Future<EmergencyState> build() async {
    return const EmergencyState();
  }

  void selectKind(EmergencyKind kind) {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    state = AsyncData(current.copyWith(kind: kind));
  }

  void updateNote(String note) {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    state = AsyncData(current.copyWith(note: note));
  }

  Future<bool> submit() async {
    final current = _current;
    if (current == null || current.isSubmitting) return false;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final emergency = await ref.read(emergencyRepositoryProvider).create(
            kind: current.kind,
            note: current.note.trim(),
          );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          sentEmergency: emergency,
        ),
      );
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

  void sendAnother() {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    state = const AsyncData(EmergencyState());
  }

  EmergencyState? get _current {
    EmergencyState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
