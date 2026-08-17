import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/onboarding/data/onboarding_api_service.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/domain/onboarding_repository.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';

final onboardingRepositoryProvider = Provider<OnboardingRepository>((ref) {
  return ApiOnboardingRepository(ref.watch(onboardingApiServiceProvider));
});

class ApiOnboardingRepository implements OnboardingRepository {
  ApiOnboardingRepository(this._service);

  final OnboardingApiService _service;

  @override
  Future<List<CommunityOption>> loadCommunities() async {
    try {
      final data = await _service.loadOptions();
      final communities = data['communities'];
      if (communities is! List<dynamic>) {
        throw const FormatException('Communities are invalid.');
      }
      return communities
          .map((item) => _community(item as Map<String, dynamic>))
          .toList(growable: false);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  @override
  Future<ResidencyRequest> submitResidencyRequest({
    required String communityId,
    required String rtId,
    required String houseCode,
    required String fullName,
    required HouseholdRelationship relationship,
  }) async {
    try {
      final data = await _service.createResidencyRequest(
        communityId: communityId,
        rtId: rtId,
        houseCode: houseCode,
        fullName: fullName,
        relationship: relationship,
      );
      final request = data['request'] as Map<String, dynamic>;
      final house = request['house'] as Map<String, dynamic>;
      return ResidencyRequest(
        id: request['id'] as String,
        status: ResidencyRequestStatus.fromApi(request['status']),
        fullName: request['fullName'] as String,
        relationship: HouseholdRelationship.fromApi(request['relationship']),
        submittedAt: DateTime.parse(request['submittedAt'] as String),
        community: _community(
          request['community'] as Map<String, dynamic>,
        ),
        house: ResidencyHouse(
          id: house['id'] as String,
          code: house['code'] as String,
          block: house['block'] as String,
          number: house['number'] as String,
          addressLabel: house['addressLabel'] as String,
        ),
      );
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  CommunityOption _community(Map<String, dynamic> json) {
    final rts = json['rts'];
    return CommunityOption(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      timezone: json['timezone'] as String,
      rts: rts is List<dynamic>
          ? rts
              .map((item) => _rt(item as Map<String, dynamic>))
              .toList(growable: false)
          : const [],
    );
  }

  RtOption _rt(Map<String, dynamic> json) {
    return RtOption(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
    );
  }
}
