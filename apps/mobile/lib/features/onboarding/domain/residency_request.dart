import 'package:komplekku/features/onboarding/domain/community_option.dart';

enum HouseholdRelationship {
  head('HEAD', 'Kepala keluarga'),
  spouse('SPOUSE', 'Pasangan'),
  child('CHILD', 'Anak'),
  parent('PARENT', 'Orang tua'),
  relative('RELATIVE', 'Kerabat'),
  tenant('TENANT', 'Penyewa'),
  other('OTHER', 'Lainnya');

  const HouseholdRelationship(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static HouseholdRelationship fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Household relationship is invalid.');
    }
    for (final relationship in values) {
      if (relationship.apiValue == value) return relationship;
    }
    throw FormatException('Unsupported household relationship: $value');
  }
}

class ResidencyHouse {
  const ResidencyHouse({
    required this.id,
    required this.code,
    required this.block,
    required this.number,
    required this.addressLabel,
  });

  final String id;
  final String code;
  final String block;
  final String number;
  final String addressLabel;
}

enum ResidencyRequestStatus {
  pending('PENDING'),
  active('ACTIVE'),
  rejected('REJECTED');

  const ResidencyRequestStatus(this.apiValue);

  final String apiValue;

  static ResidencyRequestStatus fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Residency request status is invalid.');
    }
    for (final status in values) {
      if (status.apiValue == value) return status;
    }
    throw FormatException('Unsupported residency request status: $value');
  }
}

class ResidencyRequest {
  const ResidencyRequest({
    required this.id,
    required this.status,
    required this.fullName,
    required this.relationship,
    required this.submittedAt,
    required this.community,
    required this.house,
  });

  final String id;
  final ResidencyRequestStatus status;
  final String fullName;
  final HouseholdRelationship relationship;
  final DateTime submittedAt;
  final CommunityOption community;
  final ResidencyHouse house;
}
