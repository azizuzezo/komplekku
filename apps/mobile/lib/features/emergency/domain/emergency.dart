enum EmergencyKind { security, medical, fire, environmental, other }

EmergencyKind _kindFromApi(Object? value) {
  switch (value) {
    case 'MEDICAL':
      return EmergencyKind.medical;
    case 'FIRE':
      return EmergencyKind.fire;
    case 'ENVIRONMENTAL':
      return EmergencyKind.environmental;
    case 'OTHER':
      return EmergencyKind.other;
    default:
      return EmergencyKind.security;
  }
}

String emergencyKindToApi(EmergencyKind kind) {
  switch (kind) {
    case EmergencyKind.medical:
      return 'MEDICAL';
    case EmergencyKind.fire:
      return 'FIRE';
    case EmergencyKind.environmental:
      return 'ENVIRONMENTAL';
    case EmergencyKind.other:
      return 'OTHER';
    case EmergencyKind.security:
      return 'SECURITY';
  }
}

enum EmergencyStatus { sent, acknowledged, responding, resolved }

EmergencyStatus _statusFromApi(Object? value) {
  switch (value) {
    case 'ACKNOWLEDGED':
      return EmergencyStatus.acknowledged;
    case 'RESPONDING':
      return EmergencyStatus.responding;
    case 'RESOLVED':
      return EmergencyStatus.resolved;
    default:
      return EmergencyStatus.sent;
  }
}

class Emergency {
  const Emergency({
    required this.id,
    required this.kind,
    required this.status,
    required this.houseLabel,
    required this.senderName,
    required this.note,
    required this.sentAt,
    required this.acknowledgedAt,
    required this.respondingAt,
    required this.resolvedAt,
  });

  final String id;
  final EmergencyKind kind;
  final EmergencyStatus status;
  final String houseLabel;
  final String senderName;
  final String? note;
  final DateTime sentAt;
  final DateTime? acknowledgedAt;
  final DateTime? respondingAt;
  final DateTime? resolvedAt;

  factory Emergency.fromJson(Map<String, dynamic> json) {
    final acknowledgedAt = json['acknowledgedAt'];
    final respondingAt = json['respondingAt'];
    final resolvedAt = json['resolvedAt'];
    return Emergency(
      id: json['id'] as String,
      kind: _kindFromApi(json['kind']),
      status: _statusFromApi(json['status']),
      houseLabel: json['houseLabel'] as String,
      senderName: json['senderName'] as String,
      note: json['note'] as String?,
      sentAt: DateTime.parse(json['sentAt'] as String),
      acknowledgedAt:
          acknowledgedAt is String ? DateTime.parse(acknowledgedAt) : null,
      respondingAt: respondingAt is String ? DateTime.parse(respondingAt) : null,
      resolvedAt: resolvedAt is String ? DateTime.parse(resolvedAt) : null,
    );
  }
}
