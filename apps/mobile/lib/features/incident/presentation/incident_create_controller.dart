import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/incident/data/incident_repository.dart';
import 'package:komplekku/features/incident/domain/incident.dart';

final incidentCreateControllerProvider =
    AsyncNotifierProvider<IncidentCreateController, IncidentCreateState>(
  IncidentCreateController.new,
  isAutoDispose: true,
);

class IncidentCreateState {
  const IncidentCreateState({
    this.isSubmitting = false,
    this.submissionError,
    this.createdIncident,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final IncidentDetail? createdIncident;

  IncidentCreateState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    IncidentDetail? createdIncident,
  }) {
    return IncidentCreateState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      createdIncident: createdIncident ?? this.createdIncident,
    );
  }
}

class IncidentCreateController extends AsyncNotifier<IncidentCreateState> {
  @override
  IncidentCreateState build() => const IncidentCreateState();

  Future<IncidentDetail?> submit({
    required IncidentCategory category,
    required String title,
    required String description,
    String? location,
    required DateTime occurredAt,
    String? peopleInvolved,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return null;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final incident = await ref.read(incidentRepositoryProvider).create(
            category: category,
            title: title,
            description: description,
            location: location,
            occurredAt: occurredAt,
            peopleInvolved: peopleInvolved,
          );
      state = AsyncData(
        IncidentCreateState(createdIncident: incident),
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
    state = const AsyncData(IncidentCreateState());
  }

  IncidentCreateState? get _current {
    IncidentCreateState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
