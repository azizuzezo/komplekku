import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/package/domain/package.dart';

Map<String, dynamic> _baseJson() => {
      'id': 'c3f1c2d4-1111-4a2b-9c3d-000000000001',
      'recipientName': 'Siti Rahma',
      'courier': 'JNE',
      'trackingNumber': 'JNE123456789',
      'status': 'RECEIVED',
      'houseCode': 'F01',
      'householdDisplayName': 'Rumah F01',
      'receivedAt': '2026-08-11T04:17:00.000Z',
      'collectedAt': null,
      'collectedByName': null,
    };

void main() {
  test('parses a freshly received package', () {
    final package = Package.fromJson(_baseJson());

    expect(package.status, PackageStatus.received);
    expect(package.trackingNumber, 'JNE123456789');
    expect(package.collectedAt, isNull);
    expect(package.collectedByName, isNull);
  });

  test('parses a notified package awaiting pickup', () {
    final package = Package.fromJson({..._baseJson(), 'status': 'NOTIFIED'});

    expect(package.status, PackageStatus.notified);
  });

  test('parses a collected package with pickup details', () {
    final package = Package.fromJson({
      ..._baseJson(),
      'status': 'COLLECTED',
      'collectedAt': '2026-08-12T09:30:00.000Z',
      'collectedByName': 'Andi Wijaya',
    });

    expect(package.status, PackageStatus.collected);
    expect(package.collectedAt, DateTime.parse('2026-08-12T09:30:00.000Z'));
    expect(package.collectedByName, 'Andi Wijaya');
  });

  test('parses a package with no tracking number', () {
    final package = Package.fromJson({..._baseJson(), 'trackingNumber': null});

    expect(package.trackingNumber, isNull);
  });

  test('falls back to received status for an unknown value', () {
    final package = Package.fromJson({..._baseJson(), 'status': 'SOMETHING_NEW'});

    expect(package.status, PackageStatus.received);
  });
}
