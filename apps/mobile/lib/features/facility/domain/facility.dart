enum FacilityBookingStatus { confirmed, cancelled }

FacilityBookingStatus facilityBookingStatusFromApi(Object? value) {
  switch (value) {
    case 'CANCELLED':
      return FacilityBookingStatus.cancelled;
    default:
      return FacilityBookingStatus.confirmed;
  }
}

class Facility {
  const Facility({
    required this.id,
    required this.name,
    required this.openTime,
    required this.closeTime,
    required this.capacity,
    required this.rules,
  });

  final String id;
  final String name;
  final String openTime;
  final String closeTime;
  final int? capacity;
  final String? rules;

  factory Facility.fromJson(Map<String, dynamic> json) {
    return Facility(
      id: json['id'] as String,
      name: json['name'] as String,
      openTime: json['openTime'] as String,
      closeTime: json['closeTime'] as String,
      capacity: json['capacity'] as int?,
      rules: json['rules'] as String?,
    );
  }
}

class FacilityBooking {
  const FacilityBooking({
    required this.id,
    required this.facilityId,
    required this.facilityName,
    required this.bookingDate,
    required this.startTime,
    required this.endTime,
    required this.purpose,
    required this.status,
    required this.bookedByName,
    required this.houseCode,
    required this.householdDisplayName,
    required this.createdAt,
  });

  final String id;
  final String facilityId;
  final String facilityName;
  final String bookingDate;
  final String startTime;
  final String endTime;
  final String? purpose;
  final FacilityBookingStatus status;
  final String bookedByName;
  final String houseCode;
  final String householdDisplayName;
  final DateTime createdAt;

  factory FacilityBooking.fromJson(Map<String, dynamic> json) {
    return FacilityBooking(
      id: json['id'] as String,
      facilityId: json['facilityId'] as String,
      facilityName: json['facilityName'] as String,
      bookingDate: json['bookingDate'] as String,
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      purpose: json['purpose'] as String?,
      status: facilityBookingStatusFromApi(json['status']),
      bookedByName: json['bookedByName'] as String,
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
