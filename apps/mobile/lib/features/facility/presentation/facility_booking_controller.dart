import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/facility/data/facility_repository.dart';
import 'package:komplekku/features/facility/domain/facility.dart';

final facilityBookingControllerProvider = AsyncNotifierProvider<
    FacilityBookingController, FacilityBookingFormState>(
  FacilityBookingController.new,
  isAutoDispose: true,
);

class FacilityBookingFormState {
  const FacilityBookingFormState({
    this.isSubmitting = false,
    this.submissionError,
    this.createdBooking,
  });

  final bool isSubmitting;
  final ApiException? submissionError;
  final FacilityBooking? createdBooking;

  FacilityBookingFormState copyWith({
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    FacilityBooking? createdBooking,
  }) {
    return FacilityBookingFormState(
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      createdBooking: createdBooking ?? this.createdBooking,
    );
  }
}

class FacilityBookingController
    extends AsyncNotifier<FacilityBookingFormState> {
  @override
  Future<FacilityBookingFormState> build() async {
    return const FacilityBookingFormState();
  }

  Future<FacilityBooking?> submit({
    required String facilityId,
    required String bookingDate,
    required String startTime,
    required String endTime,
    String? purpose,
  }) async {
    final current = _current;
    if (current == null || current.isSubmitting) return null;

    state = AsyncData(
      current.copyWith(isSubmitting: true, clearSubmissionError: true),
    );
    try {
      final booking = await ref.read(facilityRepositoryProvider).createBooking(
            facilityId: facilityId,
            bookingDate: bookingDate,
            startTime: startTime,
            endTime: endTime,
            purpose: purpose,
          );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          createdBooking: booking,
        ),
      );
      ref.invalidate(
        facilityBookingListProvider((
          facilityId: facilityId,
          date: bookingDate,
        )),
      );
      return booking;
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

  FacilityBookingFormState? get _current {
    FacilityBookingFormState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
