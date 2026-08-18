/// SYSTEM = the seeded community-wide / per-RT "Forum Warga"; PRIVATE = a
/// forum a warga opened themselves, readable only by invited members who
/// accepted.
enum ForumChannelKind { system, private }

enum ForumMemberStatus { pending, accepted, declined }

ForumChannelKind _kindFromApi(Object? value) =>
    value == 'PRIVATE' ? ForumChannelKind.private : ForumChannelKind.system;

ForumMemberStatus? _memberStatusFromApi(Object? value) {
  switch (value) {
    case 'PENDING':
      return ForumMemberStatus.pending;
    case 'ACCEPTED':
      return ForumMemberStatus.accepted;
    case 'DECLINED':
      return ForumMemberStatus.declined;
    default:
      return null;
  }
}

class ForumChannel {
  const ForumChannel({
    required this.id,
    required this.rtId,
    required this.kind,
    required this.name,
    required this.description,
    required this.createdByUserId,
    required this.membershipStatus,
    required this.isOwner,
    required this.memberCount,
  });

  final String id;
  final String? rtId;
  final ForumChannelKind kind;
  final String name;
  final String? description;
  final String? createdByUserId;

  /// The viewer's own membership. Null on SYSTEM channels, which everyone in
  /// scope can read without being invited.
  final ForumMemberStatus? membershipStatus;
  final bool isOwner;
  final int memberCount;

  bool get isPrivate => kind == ForumChannelKind.private;

  bool get isPendingInvitation =>
      membershipStatus == ForumMemberStatus.pending;

  /// Tab label: a private forum carries its own name, while the seeded
  /// community-wide channel needs the "Semua RT" hint to distinguish it from
  /// the per-RT ones.
  String get label =>
      isPrivate ? name : (rtId == null ? 'Semua RT' : name);

  factory ForumChannel.fromJson(Map<String, dynamic> json) {
    return ForumChannel(
      id: json['id'] as String,
      rtId: json['rtId'] as String?,
      kind: _kindFromApi(json['kind']),
      name: json['name'] as String,
      description: json['description'] as String?,
      createdByUserId: json['createdByUserId'] as String?,
      membershipStatus: _memberStatusFromApi(json['membershipStatus']),
      isOwner: json['isOwner'] as bool? ?? false,
      memberCount: (json['memberCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class ForumChannelMember {
  const ForumChannelMember({
    required this.userId,
    required this.displayName,
    required this.houseLabel,
    required this.status,
    required this.isOwner,
  });

  final String userId;
  final String displayName;
  final String? houseLabel;
  final ForumMemberStatus status;
  final bool isOwner;

  factory ForumChannelMember.fromJson(Map<String, dynamic> json) {
    return ForumChannelMember(
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      houseLabel: json['houseLabel'] as String?,
      status: _memberStatusFromApi(json['status']) ?? ForumMemberStatus.pending,
      isOwner: json['isOwner'] as bool? ?? false,
    );
  }
}

/// A resident with a linked account who can be invited into a private forum.
class ForumMemberCandidate {
  const ForumMemberCandidate({
    required this.userId,
    required this.displayName,
    required this.houseLabel,
  });

  final String userId;
  final String displayName;
  final String? houseLabel;

  factory ForumMemberCandidate.fromJson(Map<String, dynamic> json) {
    return ForumMemberCandidate(
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      houseLabel: json['houseLabel'] as String?,
    );
  }
}
