import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/incident/data/incident_repository.dart';
import 'package:komplekku/features/incident/domain/incident.dart';

final incidentUpdateControllerProvider =
    AsyncNotifierProvider<IncidentUpdateController, IncidentUpdateState>(
  IncidentUpdateController.new,
  isAutoDispose: true,
);

class IncidentUpdateState {
  const IncidentUpdateState({
    this.isSubmitting = false,
    this.submissionError,
    this.updatedIncident,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final IncidentDetail? updatedIncident;

  IncidentUpdateState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    IncidentDetail? updatedIncident,
  }) {
    return IncidentUpdateState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      updatedIncident: updatedIncident ?? this.updatedIncident,
    );
  }
}

class IncidentUpdateController extends AsyncNotifier<IncidentUpdateState> {
  @override
  IncidentUpdateState build() => const IncidentUpdateState();

  Future<IncidentDetail?> submit({
    required String incidentId,
    IncidentStatus? status,
    String? actionTaken,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return null;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final incident = await ref.read(incidentRepositoryProvider).update(
            incidentId,
            status: status,
            actionTaken: actionTaken,
          );
      state = AsyncData(
        IncidentUpdateState(updatedIncident: incident),
      );
      return incident;
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
    state = const AsyncData(IncidentUpdateState());
  }

  IncidentUpdateState? get _current {
    IncidentUpdateState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
