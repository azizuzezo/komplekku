import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/home/domain/home_snapshot.dart';

void main() {
  test('parses a tenant-scoped home response', () {
    final snapshot = HomeSnapshot.fromJson({
      'data': {
        'viewer': {'firstName': 'Aziz'},
        'community': {'name': 'Billabong Blok F'},
        'household': {
          'house': {'addressLabel': 'Blok F No. 01'},
        },
        'latestAnnouncements': [
          {
            'id': 'announcement-1',
            'title': '[Demo] Kerja bakti',
            'summary': 'Minggu pukul 07.00.',
            'publishedAt': '2026-08-11T03:00:00.000Z',
            'isRead': false,
          },
        ],
      },
    });

    expect(snapshot.firstName, 'Aziz');
    expect(snapshot.communityName, 'Billabong Blok F');
    expect(snapshot.announcements.single.isRead, isFalse);
    expect(snapshot.isCached, isFalse);
  });

  test('marks a locally restored home response as cached', () {
    final snapshot = HomeSnapshot.fromJson(
      {
        'data': {
          'viewer': {'firstName': 'Aziz'},
          'community': {'name': 'Billabong Blok F'},
          'household': {
            'house': {'addressLabel': 'Blok F No. 01'},
          },
          'latestAnnouncements': <Map<String, dynamic>>[],
        },
      },
      isCached: true,
    );

    expect(snapshot.isCached, isTrue);
    expect(snapshot.announcements, isEmpty);
  });
}
