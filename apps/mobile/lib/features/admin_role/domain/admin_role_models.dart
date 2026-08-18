class RoleOption {
  const RoleOption({required this.code, required this.name});

  final String code;
  final String name;

  factory RoleOption.fromJson(Map<String, dynamic> json) {
    return RoleOption(code: json['code'] as String, name: json['name'] as String);
  }
}

class CommunityMember {
  const CommunityMember({
    required this.residentId,
    required this.userId,
    required this.displayName,
    required this.phoneMasked,
    required this.houseCode,
    required this.rtCode,
    required this.roles,
  });

  final String residentId;
  final String userId;
  final String displayName;
  final String phoneMasked;
  final String? houseCode;
  final String? rtCode;
  final List<RoleOption> roles;

  factory CommunityMember.fromJson(Map<String, dynamic> json) {
    final roles = json['roles'] as List;
    return CommunityMember(
      residentId: json['residentId'] as String,
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      phoneMasked: json['phoneMasked'] as String,
      houseCode: json['houseCode'] as String?,
      rtCode: json['rtCode'] as String?,
      roles: roles
          .map((role) => RoleOption.fromJson(role as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}
