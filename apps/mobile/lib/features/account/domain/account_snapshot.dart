class AccountHouse {
  const AccountHouse({required this.code, required this.addressLabel});

  final String code;
  final String addressLabel;

  factory AccountHouse.fromJson(Map<String, dynamic> json) {
    return AccountHouse(
      code: json['code'] as String,
      addressLabel: json['addressLabel'] as String,
    );
  }
}

class AccountContext {
  const AccountContext({
    required this.communityName,
    required this.householdDisplayName,
    required this.house,
  });

  final String communityName;
  final String householdDisplayName;
  final AccountHouse house;

  factory AccountContext.fromJson(Map<String, dynamic> json) {
    final community = json['community'] as Map<String, dynamic>;
    final household = json['household'] as Map<String, dynamic>;
    return AccountContext(
      communityName: community['name'] as String,
      householdDisplayName: household['displayName'] as String,
      house: AccountHouse.fromJson(household['house'] as Map<String, dynamic>),
    );
  }
}

enum AccountResidentStatus { pending, active, rejected, suspended, movedOut }

AccountResidentStatus? _residentStatusFromApi(Object? value) {
  switch (value) {
    case 'PENDING':
      return AccountResidentStatus.pending;
    case 'ACTIVE':
      return AccountResidentStatus.active;
    case 'REJECTED':
      return AccountResidentStatus.rejected;
    case 'SUSPENDED':
      return AccountResidentStatus.suspended;
    case 'MOVED_OUT':
      return AccountResidentStatus.movedOut;
    default:
      return null;
  }
}

class AccountSnapshot {
  const AccountSnapshot({
    required this.displayName,
    required this.phoneMasked,
    required this.residentStatus,
    required this.context,
    required this.permissions,
  });

  final String? displayName;
  final String phoneMasked;
  final AccountResidentStatus? residentStatus;
  final AccountContext? context;
  final List<String> permissions;

  bool get hasActiveResidency =>
      residentStatus == AccountResidentStatus.active && context != null;

  factory AccountSnapshot.fromJson(Map<String, dynamic> json) {
    final contextJson = json['currentContext'];
    final permissions = json['permissions'] as List<dynamic>? ?? const [];
    return AccountSnapshot(
      displayName: json['displayName'] as String?,
      phoneMasked: json['phoneMasked'] as String,
      residentStatus: _residentStatusFromApi(json['residentStatus']),
      context: contextJson is Map<String, dynamic>
          ? AccountContext.fromJson(contextJson)
          : null,
      permissions: permissions.cast<String>(),
    );
  }
}

String residentStatusLabel(AccountResidentStatus status) {
  switch (status) {
    case AccountResidentStatus.active:
      return 'Aktif';
    case AccountResidentStatus.pending:
      return 'Menunggu verifikasi';
    case AccountResidentStatus.rejected:
      return 'Ditolak';
    case AccountResidentStatus.suspended:
      return 'Ditangguhkan';
    case AccountResidentStatus.movedOut:
      return 'Sudah pindah';
  }
}
