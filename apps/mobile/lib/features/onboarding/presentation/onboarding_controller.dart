import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/onboarding/data/api_onboarding_repository.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';

final onboardingControllerProvider =
    AsyncNotifierProvider<OnboardingController, OnboardingState>(
  OnboardingController.new,
  isAutoDispose: true,
);

class OnboardingState {
  const OnboardingState({
    required this.communities,
    this.selectedCommunity,
    this.isDetailsStep = false,
    this.isSubmitting = false,
    this.submissionError,
    this.completedRequest,
  });

  final List<CommunityOption> communities;
  final CommunityOption? selectedCommunity;
  final bool isDetailsStep;
  final bool isSubmitting;
  final ApiException? submissionError;
  final ResidencyRequest? completedRequest;

  OnboardingState copyWith({
    CommunityOption? selectedCommunity,
    bool? isDetailsStep,
    bool? isSubmitting,
    ApiException? submissionError,
    bool clearSubmissionError = false,
    ResidencyRequest? completedRequest,
  }) {
    return OnboardingState(
      communities: communities,
      selectedCommunity: selectedCommunity ?? this.selectedCommunity,
      isDetailsStep: isDetailsStep ?? this.isDetailsStep,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      submissionError: clearSubmissionError
          ? null
          : submissionError ?? this.submissionError,
      completedRequest: completedRequest ?? this.completedRequest,
    );
  }
}

class OnboardingController extends AsyncNotifier<OnboardingState> {
  @override
  Future<OnboardingState> build() async {
    final communities =
        await ref.watch(onboardingRepositoryProvider).loadCommunities();
    return OnboardingState(communities: communities);
  }

  void selectCommunity(CommunityOption community) {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    if (!current.communities.any((item) => item.id == community.id)) return;
    state = AsyncData(
      current.copyWith(
        selectedCommunity: community,
        clearSubmissionError: true,
      ),
    );
  }

  void continueToDetails() {
    final current = _current;
    if (current?.selectedCommunity == null || current!.isSubmitting) return;
    state = AsyncData(
      current.copyWith(
        isDetailsStep: true,
        clearSubmissionError: true,
      ),
    );
  }

  void backToCommunities() {
    final current = _current;
    if (current == null || current.isSubmitting) return;
    state = AsyncData(
      current.copyWith(
        isDetailsStep: false,
        clearSubmissionError: true,
      ),
    );
  }

  Future<ResidencyRequest?> submit({
    required String fullName,
    required String houseCode,
    required HouseholdRelationship relationship,
  }) async {
    final current = _current;
    final community = current?.selectedCommunity;
    if (current == null || community == null || current.isSubmitting) {
      return null;
    }

    state = AsyncData(
      current.copyWith(
        isSubmitting: true,
        clearSubmissionError: true,
      ),
    );
    try {
      final request =
          await ref.read(onboardingRepositoryProvider).submitResidencyRequest(
                communityId: community.id,
                houseCode: houseCode,
                fullName: fullName,
                relationship: relationship,
              );
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          clearSubmissionError: true,
          completedRequest: request,
        ),
      );
      return request;
    } catch (error) {
      final failure = error is ApiException
          ? error
          : ApiException.malformedResponse();
      state = AsyncData(
        current.copyWith(
          isSubmitting: false,
          submissionError: failure,
        ),
      );
      return null;
    }
  }

  Future<void> retryLoad() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final communities =
          await ref.read(onboardingRepositoryProvider).loadCommunities();
      return OnboardingState(communities: communities);
    });
  }

  OnboardingState? get _current {
    OnboardingState? current;
    state.whenData((value) => current = value);
    return current;
  }
}
