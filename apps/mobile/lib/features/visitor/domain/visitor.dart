enum VisitorStatus { pending, checkedIn, checkedOut, cancelled }

VisitorStatus _statusFromApi(Object? value) {
  switch (value) {
    case 'CHECKED_IN':
      return VisitorStatus.checkedIn;
    case 'CHECKED_OUT':
      return VisitorStatus.checkedOut;
    case 'CANCELLED':
      return VisitorStatus.cancelled;
    default:
      return VisitorStatus.pending;
  }
}

class Visitor {
  const Visitor({
    required this.id,
    required this.guestName,
    required this.guestPhone,
    required this.visitDate,
    required this.expectedTime,
    required this.vehicleInfo,
    required this.plate,
    required this.purpose,
    required this.notes,
    required this.status,
    required this.isWalkIn,
    required this.houseCode,
    required this.householdDisplayName,
    required this.checkedInAt,
    required this.checkedOutAt,
    required this.createdAt,
    this.qrToken,
  });

  final String id;
  final String guestName;
  final String? guestPhone;

  /// YYYY-MM-DD, matching the API's date-only contract.
  final String visitDate;

  /// HH:mm local wall-clock time, matching the API's time-only contract.
  final String? expectedTime;
  final String? vehicleInfo;
  final String? plate;
  final String? purpose;
  final String? notes;
  final VisitorStatus status;
  final bool isWalkIn;
  final String houseCode;
  final String householdDisplayName;
  final DateTime? checkedInAt;
  final DateTime? checkedOutAt;
  final DateTime createdAt;

  /// Only present when the API includes it — residents (who lack
  /// `visitor.checkin`) get this back on both create and list responses so
  /// they can show the QR code to security; security staff never receive it.
  final String? qrToken;

  factory Visitor.fromJson(Map<String, dynamic> json) {
    final checkedInAt = json['checkedInAt'];
    final checkedOutAt = json['checkedOutAt'];
    return Visitor(
      id: json['id'] as String,
      guestName: json['guestName'] as String,
      guestPhone: json['guestPhone'] as String?,
      visitDate: json['visitDate'] as String,
      expectedTime: json['expectedTime'] as String?,
      vehicleInfo: json['vehicleInfo'] as String?,
      plate: json['plate'] as String?,
      purpose: json['purpose'] as String?,
      notes: json['notes'] as String?,
      status: _statusFromApi(json['status']),
      isWalkIn: json['isWalkIn'] as bool? ?? false,
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      checkedInAt: checkedInAt is String ? DateTime.parse(checkedInAt) : null,
      checkedOutAt:
          checkedOutAt is String ? DateTime.parse(checkedOutAt) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      qrToken: json['qrToken'] as String?,
    );
  }
}
