import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/patrol/data/patrol_repository.dart';
import 'package:komplekku/features/patrol/domain/patrol.dart';

/// Drives the guard's own patrol session: starting a patrol, scanning
/// checkpoints, and ending it. Mirrors `apps/web/features/patrol/patrol-panel.tsx`'s
/// session mutations, folded into a single `AsyncNotifier` controller
/// (start/scan/end) instead of separate one-shot mutations, since the mobile
/// screen keeps a single active-session state alive across all three actions.
final patrolSessionControllerProvider = AsyncNotifierProvider<
    PatrolSessionController, PatrolSessionState>(
  PatrolSessionController.new,
  isAutoDispose: true,
);

class PatrolSessionState {
  const PatrolSessionState({
    this.session,
    this.isSubmitting = false,
    this.submissionError,
  });

  final PatrolSession? session;
  final bool isSubmitting;
  final ApiException? submissionError;

  PatrolSessionState copyWith({
    PatrolSession? session,
    bool clearSession = false,
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
  }) {
    return PatrolSessionState(
      session: clearSession ? null : session ?? this.session,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
    );
  }
}

class PatrolSessionController extends AsyncNotifier<PatrolSessionState> {
  @override
  Future<PatrolSessionState> build() async {
    final session = await ref.watch(patrolRepositoryProvider).getActiveSession();
    return PatrolSessionState(session: session);
  }

  Future<void> start() async {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final session = await ref.read(patrolRepositoryProvider).startSession();
      state = AsyncData(PatrolSessionState(session: session));
    } catch (error) {
      _fail(current, error);
    }
  }

  Future<void> scan({required String qrToken, String? note}) async {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final session = await ref
          .read(patrolRepositoryProvider)
          .scanCheckpoint(qrToken: qrToken, note: note);
      state = AsyncData(PatrolSessionState(session: session));
    } catch (error) {
      _fail(current, error);
    }
  }

  Future<void> end() async {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final session = await ref.read(patrolRepositoryProvider).endSession();
      state = AsyncData(
        PatrolSessionState(session: session),
      );
    } catch (error) {
      _fail(current, error);
    }
  }

  void _fail(PatrolSessionState current, Object error) {
    final failure =
        error is ApiException ? error : ApiException.malformedResponse();
    state = AsyncData(
      current.copyWith(isSubmitting: false, submissionError: failure),
    );
  }

  PatrolSessionState? get _current {
    PatrolSessionState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
