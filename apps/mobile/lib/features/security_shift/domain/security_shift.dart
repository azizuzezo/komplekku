enum SecurityShiftStatus {
  active('ACTIVE'),
  completed('COMPLETED');

  const SecurityShiftStatus(this.apiValue);

  final String apiValue;

  static SecurityShiftStatus fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Security shift status is invalid.');
    }
    for (final status in values) {
      if (status.apiValue == value) return status;
    }
    throw FormatException('Unsupported security shift status: $value');
  }
}

/// Mirrors `SecurityShift` in `packages/contracts/src/security-shift.ts`.
class SecurityShift {
  const SecurityShift({
    required this.id,
    required this.officerName,
    required this.status,
    required this.startedAt,
    required this.endedAt,
    required this.notes,
  });

  final String id;
  final String officerName;
  final SecurityShiftStatus status;
  final DateTime startedAt;
  final DateTime? endedAt;
  final String? notes;

  factory SecurityShift.fromJson(Map<String, dynamic> json) {
    final endedAt = json['endedAt'] as String?;
    return SecurityShift(
      id: json['id'] as String,
      officerName: json['officerName'] as String,
      status: SecurityShiftStatus.fromApi(json['status']),
      startedAt: DateTime.parse(json['startedAt'] as String),
      endedAt: endedAt != null ? DateTime.parse(endedAt) : null,
      notes: json['notes'] as String?,
    );
  }
}
