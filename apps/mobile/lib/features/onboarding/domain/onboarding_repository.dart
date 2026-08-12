import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';

abstract interface class OnboardingRepository {
  Future<List<CommunityOption>> loadCommunities();

  Future<ResidencyRequest> submitResidencyRequest({
    required String communityId,
    required String houseCode,
    required String fullName,
    required HouseholdRelationship relationship,
  });
}
