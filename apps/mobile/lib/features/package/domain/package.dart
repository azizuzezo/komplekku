enum PackageStatus { received, notified, collected }

PackageStatus _statusFromApi(Object? value) {
  switch (value) {
    case 'NOTIFIED':
      return PackageStatus.notified;
    case 'COLLECTED':
      return PackageStatus.collected;
    default:
      return PackageStatus.received;
  }
}

class Package {
  const Package({
    required this.id,
    required this.recipientName,
    required this.courier,
    required this.trackingNumber,
    required this.status,
    required this.houseCode,
    required this.householdDisplayName,
    required this.receivedAt,
    required this.collectedAt,
    required this.collectedByName,
  });

  final String id;
  final String recipientName;
  final String courier;
  final String? trackingNumber;
  final PackageStatus status;
  final String houseCode;
  final String householdDisplayName;
  final DateTime receivedAt;
  final DateTime? collectedAt;
  final String? collectedByName;

  factory Package.fromJson(Map<String, dynamic> json) {
    final collectedAt = json['collectedAt'];
    return Package(
      id: json['id'] as String,
      recipientName: json['recipientName'] as String,
      courier: json['courier'] as String,
      trackingNumber: json['trackingNumber'] as String?,
      status: _statusFromApi(json['status']),
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      receivedAt: DateTime.parse(json['receivedAt'] as String),
      collectedAt: collectedAt is String ? DateTime.parse(collectedAt) : null,
      collectedByName: json['collectedByName'] as String?,
    );
  }
}
