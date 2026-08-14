import 'package:komplekku/features/onboarding/domain/residency_request.dart';

class AdminResidencyRequest {
  const AdminResidencyRequest({
    required this.id,
    required this.fullName,
    required this.relationship,
    required this.submittedAt,
    required this.communityName,
    required this.houseCode,
    required this.houseAddressLabel,
    required this.userPhoneMasked,
  });

  final String id;
  final String fullName;
  final HouseholdRelationship relationship;
  final DateTime submittedAt;
  final String communityName;
  final String houseCode;
  final String houseAddressLabel;
  final String userPhoneMasked;

  factory AdminResidencyRequest.fromJson(Map<String, dynamic> json) {
    final community = json['community'] as Map<String, dynamic>;
    final house = json['house'] as Map<String, dynamic>;
    final user = json['user'] as Map<String, dynamic>;
    return AdminResidencyRequest(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      relationship: HouseholdRelationship.fromApi(json['relationship']),
      submittedAt: DateTime.parse(json['submittedAt'] as String),
      communityName: community['name'] as String,
      houseCode: house['code'] as String,
      houseAddressLabel: house['addressLabel'] as String,
      userPhoneMasked: user['phoneMasked'] as String,
    );
  }
}
