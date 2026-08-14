import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/account/domain/account_snapshot.dart';

void main() {
  test('an active resident with a household has active residency', () {
    final snapshot = AccountSnapshot.fromJson({
      'id': '00000000-0000-4000-8000-000000000001',
      'displayName': 'Aziz Pratama',
      'phoneMasked': '+62••••0001',
      'residentStatus': 'ACTIVE',
      'currentContext': {
        'community': {'name': 'Billabong Blok F'},
        'household': {
          'displayName': 'Keluarga Pratama',
          'house': {'code': 'F01', 'addressLabel': 'Blok F No. 01'},
        },
      },
      'permissions': ['announcement.read', 'agenda.read'],
    });

    expect(snapshot.hasActiveResidency, isTrue);
    expect(snapshot.context!.house.code, 'F01');
    expect(snapshot.permissions, contains('announcement.read'));
  });

  test('a pending resident without a household has no active residency', () {
    final snapshot = AccountSnapshot.fromJson({
      'id': '00000000-0000-4000-8000-000000000002',
      'displayName': null,
      'phoneMasked': '+62••••0002',
      'residentStatus': 'PENDING',
      'currentContext': null,
      'permissions': <String>[],
    });

    expect(snapshot.hasActiveResidency, isFalse);
    expect(snapshot.residentStatus, AccountResidentStatus.pending);
    expect(residentStatusLabel(snapshot.residentStatus!), 'Menunggu verifikasi');
  });
}
