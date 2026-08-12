import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/visitor/domain/visitor.dart';

Map<String, dynamic> _baseJson() => {
      'id': 'b3f1c2d4-1111-4a2b-9c3d-000000000001',
      'guestName': 'Andi Wijaya',
      'guestPhone': null,
      'visitDate': '2026-08-15',
      'expectedTime': '14:30',
      'vehicleInfo': null,
      'plate': null,
      'purpose': null,
      'notes': null,
      'status': 'PENDING',
      'isWalkIn': false,
      'houseCode': 'F01',
      'householdDisplayName': 'Rumah F01',
      'checkedInAt': null,
      'checkedOutAt': null,
      'createdAt': '2026-08-11T04:17:00.000Z',
    };

void main() {
  test('parses a pending invite including its qrToken', () {
    final visitor = Visitor.fromJson({
      ..._baseJson(),
      'qrToken': 'qr-token-abc123',
    });

    expect(visitor.status, VisitorStatus.pending);
    expect(visitor.isWalkIn, isFalse);
    expect(visitor.qrToken, 'qr-token-abc123');
    expect(visitor.expectedTime, '14:30');
  });

  test('parses a checked-in visitor without a qrToken field present', () {
    final visitor = Visitor.fromJson({
      ..._baseJson(),
      'status': 'CHECKED_IN',
      'checkedInAt': '2026-08-15T07:00:00.000Z',
    });

    expect(visitor.status, VisitorStatus.checkedIn);
    expect(visitor.qrToken, isNull);
    expect(visitor.checkedInAt, DateTime.parse('2026-08-15T07:00:00.000Z'));
  });

  test('parses checked-out and cancelled statuses', () {
    final checkedOut = Visitor.fromJson({
      ..._baseJson(),
      'status': 'CHECKED_OUT',
      'checkedOutAt': '2026-08-15T09:00:00.000Z',
    });
    final cancelled = Visitor.fromJson({..._baseJson(), 'status': 'CANCELLED'});

    expect(checkedOut.status, VisitorStatus.checkedOut);
    expect(checkedOut.checkedOutAt, DateTime.parse('2026-08-15T09:00:00.000Z'));
    expect(cancelled.status, VisitorStatus.cancelled);
  });

  test('falls back to pending status for an unknown value', () {
    final visitor = Visitor.fromJson({..._baseJson(), 'status': 'SOMETHING_NEW'});

    expect(visitor.status, VisitorStatus.pending);
  });

  test('parses a walk-in visitor with vehicle details', () {
    final visitor = Visitor.fromJson({
      ..._baseJson(),
      'isWalkIn': true,
      'vehicleInfo': 'Mobil sedan hitam',
      'plate': 'B 1234 XYZ',
      'purpose': 'Antar barang',
    });

    expect(visitor.isWalkIn, isTrue);
    expect(visitor.vehicleInfo, 'Mobil sedan hitam');
    expect(visitor.plate, 'B 1234 XYZ');
    expect(visitor.purpose, 'Antar barang');
  });
}
