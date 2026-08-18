enum OccupancyStatus { ownerOccupied, rented, vacant }

OccupancyStatus occupancyStatusFromJson(String value) {
  switch (value) {
    case 'OWNER_OCCUPIED':
      return OccupancyStatus.ownerOccupied;
    case 'RENTED':
      return OccupancyStatus.rented;
    case 'VACANT':
    default:
      return OccupancyStatus.vacant;
  }
}

String occupancyStatusToJson(OccupancyStatus status) {
  switch (status) {
    case OccupancyStatus.ownerOccupied:
      return 'OWNER_OCCUPIED';
    case OccupancyStatus.rented:
      return 'RENTED';
    case OccupancyStatus.vacant:
      return 'VACANT';
  }
}

String occupancyStatusLabel(OccupancyStatus status) {
  switch (status) {
    case OccupancyStatus.ownerOccupied:
      return 'Dihuni pemilik';
    case OccupancyStatus.rented:
      return 'Disewakan';
    case OccupancyStatus.vacant:
      return 'Kosong';
  }
}

class HouseAdmin {
  const HouseAdmin({
    required this.id,
    required this.code,
    required this.block,
    required this.number,
    required this.rtId,
    required this.rtCode,
    required this.occupancyStatus,
    required this.addressLabel,
    required this.hasHousehold,
  });

  final String id;
  final String code;
  final String block;
  final String number;
  final String? rtId;
  final String? rtCode;
  final OccupancyStatus occupancyStatus;
  final String addressLabel;
  final bool hasHousehold;

  factory HouseAdmin.fromJson(Map<String, dynamic> json) {
    return HouseAdmin(
      id: json['id'] as String,
      code: json['code'] as String,
      block: json['block'] as String,
      number: json['number'] as String,
      rtId: json['rtId'] as String?,
      rtCode: json['rtCode'] as String?,
      occupancyStatus: occupancyStatusFromJson(json['occupancyStatus'] as String),
      addressLabel: json['addressLabel'] as String,
      hasHousehold: json['hasHousehold'] as bool,
    );
  }
}
