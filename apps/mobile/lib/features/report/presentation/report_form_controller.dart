import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/report/data/report_repository.dart';
import 'package:komplekku/features/report/domain/report.dart';

final reportFormControllerProvider =
    AsyncNotifierProvider<ReportFormController, ReportFormState>(
  ReportFormController.new,
  isAutoDispose: true,
);

class ReportFormState {
  const ReportFormState({
    this.isSubmitting = false,
    this.submissionError,
    this.createdReport,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final ReportDetail? createdReport;

  ReportFormState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    ReportDetail? createdReport,
  }) {
    return ReportFormState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      createdReport: createdReport ?? this.createdReport,
    );
  }
}

class ReportFormController extends AsyncNotifier<ReportFormState> {
  @override
  Future<ReportFormState> build() async {
    return const ReportFormState();
  }

  Future<ReportDetail?> submit({
    required ReportCategory category,
    required String description,
    String? location,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return null;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final report = await ref.read(reportRepositoryProvider).create(
            category: category,
            description: description,
            location: location,
          );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          createdReport: report,
        ),
      );
      ref.invalidate(reportListProvider);
      return report;
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
    state = const AsyncData(ReportFormState());
  }

  ReportFormState? get _current {
    ReportFormState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
