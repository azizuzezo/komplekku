import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/community_admin/domain/community_detail.dart';

void main() {
  test('community detail reads configured iqomah delay and defaults safely', () {
    final configured = CommunityDetail.fromJson({
      'id': 'community-id',
      'name': 'Billabong',
      'slug': 'billabong',
      'timezone': 'Asia/Jakarta',
      'address': null,
      'rwLabel': 'RW 03',
      'iqomahDelayMinutes': 12,
    });
    final legacy = CommunityDetail.fromJson({
      'id': 'community-id',
      'name': 'Billabong',
      'slug': 'billabong',
      'timezone': 'Asia/Jakarta',
      'address': null,
      'rwLabel': 'RW 03',
    });

    expect(configured.iqomahDelayMinutes, 12);
    expect(legacy.iqomahDelayMinutes, 10);
  });

  test('community admin screen exposes one bounded prayer setting', () {
    final source = File(
      'lib/features/community_admin/presentation/community_admin_screen.dart',
    ).readAsStringSync();

    expect(source, contains('Jeda adzan ke iqomah'));
    expect(source, contains('1 sampai 60 menit'));
    expect(source, contains('iqomahDelayMinutes: delay'));
  });
}
