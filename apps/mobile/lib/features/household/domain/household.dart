import 'package:komplekku/features/onboarding/domain/residency_request.dart';

class HouseholdMember {
  const HouseholdMember({
    required this.residentId,
    required this.userId,
    required this.displayName,
    required this.relationship,
    required this.linkedAccount,
    required this.phoneMasked,
  });

  final String residentId;
  final String userId;
  final String displayName;
  final HouseholdRelationship relationship;
  final bool linkedAccount;
  final String? phoneMasked;

  factory HouseholdMember.fromJson(Map<String, dynamic> json) {
    return HouseholdMember(
      residentId: json['residentId'] as String,
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      relationship: HouseholdRelationship.fromApi(json['relationship']),
      linkedAccount: json['linkedAccount'] as bool,
      phoneMasked: json['phoneMasked'] as String?,
    );
  }
}

class CurrentHousehold {
  const CurrentHousehold({
    required this.displayName,
    required this.houseCode,
    required this.houseAddressLabel,
    required this.members,
  });

  final String displayName;
  final String houseCode;
  final String houseAddressLabel;
  final List<HouseholdMember> members;

  factory CurrentHousehold.fromJson(Map<String, dynamic> json) {
    final house = json['house'] as Map<String, dynamic>;
    final members = json['members'] as List<dynamic>? ?? const [];
    return CurrentHousehold(
      displayName: json['displayName'] as String,
      houseCode: house['code'] as String,
      houseAddressLabel: house['addressLabel'] as String,
      members: members
          .map((m) => HouseholdMember.fromJson(m as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}
