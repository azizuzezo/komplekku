import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/emergency/domain/emergency.dart';

Map<String, dynamic> _baseJson() => {
      'id': 'd3f1c2d4-1111-4a2b-9c3d-000000000001',
      'kind': 'SECURITY',
      'status': 'SENT',
      'houseLabel': 'Rumah F01',
      'senderName': 'Andi Wijaya',
      'note': null,
      'sentAt': '2026-08-11T04:17:00.000Z',
      'acknowledgedAt': null,
      'respondingAt': null,
      'resolvedAt': null,
    };

void main() {
  test('parses a freshly sent security emergency', () {
    final emergency = Emergency.fromJson(_baseJson());

    expect(emergency.kind, EmergencyKind.security);
    expect(emergency.status, EmergencyStatus.sent);
    expect(emergency.acknowledgedAt, isNull);
  });

  test('parses every emergency kind', () {
    expect(
      Emergency.fromJson({..._baseJson(), 'kind': 'MEDICAL'}).kind,
      EmergencyKind.medical,
    );
    expect(
      Emergency.fromJson({..._baseJson(), 'kind': 'FIRE'}).kind,
      EmergencyKind.fire,
    );
    expect(
      Emergency.fromJson({..._baseJson(), 'kind': 'ENVIRONMENTAL'}).kind,
      EmergencyKind.environmental,
    );
    expect(
      Emergency.fromJson({..._baseJson(), 'kind': 'OTHER'}).kind,
      EmergencyKind.other,
    );
  });

  test('falls back to security kind for an unknown value', () {
    final emergency = Emergency.fromJson({..._baseJson(), 'kind': 'SOMETHING_NEW'});

    expect(emergency.kind, EmergencyKind.security);
  });

  test('parses the full status progression with timestamps', () {
    final emergency = Emergency.fromJson({
      ..._baseJson(),
      'status': 'RESOLVED',
      'note': 'Ada asap di dapur',
      'acknowledgedAt': '2026-08-11T04:18:00.000Z',
      'respondingAt': '2026-08-11T04:19:00.000Z',
      'resolvedAt': '2026-08-11T04:30:00.000Z',
    });

    expect(emergency.status, EmergencyStatus.resolved);
    expect(emergency.note, 'Ada asap di dapur');
    expect(emergency.acknowledgedAt, DateTime.parse('2026-08-11T04:18:00.000Z'));
    expect(emergency.respondingAt, DateTime.parse('2026-08-11T04:19:00.000Z'));
    expect(emergency.resolvedAt, DateTime.parse('2026-08-11T04:30:00.000Z'));
  });

  test('round-trips every kind through emergencyKindToApi', () {
    for (final kind in EmergencyKind.values) {
      final apiValue = emergencyKindToApi(kind);
      final parsed = Emergency.fromJson({..._baseJson(), 'kind': apiValue}).kind;
      expect(parsed, kind);
    }
  });
}
