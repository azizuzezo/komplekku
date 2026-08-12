import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/notification/domain/app_notification.dart';

void main() {
  test('an unread notification has no readAt and is unread', () {
    final notification = AppNotification.fromJson({
      'id': 'notification-1',
      'title': 'Agenda lingkungan mendatang',
      'message': 'Kerja bakti lingkungan dijadwalkan dua hari lagi.',
      'readAt': null,
      'createdAt': '2026-08-11T06:17:00.000Z',
      'entityType': 'EVENT',
      'entityId': 'event-1',
    });

    expect(notification.isRead, isFalse);
    expect(notification.linkedRoute, '/aktivitas/agenda/event-1');
  });

  test('a read announcement notification links to its detail page', () {
    final notification = AppNotification.fromJson({
      'id': 'notification-2',
      'title': 'Pengumuman baru',
      'message': 'Ada pengumuman baru untukmu.',
      'readAt': '2026-08-11T07:00:00.000Z',
      'createdAt': '2026-08-11T06:17:00.000Z',
      'entityType': 'ANNOUNCEMENT',
      'entityId': 'announcement-1',
    });

    expect(notification.isRead, isTrue);
    expect(notification.linkedRoute, '/aktivitas/pengumuman/announcement-1');
  });

  test('a notification without a linkable entity has no route', () {
    final notification = AppNotification.fromJson({
      'id': 'notification-3',
      'title': 'Info umum',
      'message': 'Tidak ada tautan.',
      'readAt': null,
      'createdAt': '2026-08-11T06:17:00.000Z',
      'entityType': 'OTHER',
      'entityId': null,
    });

    expect(notification.linkedRoute, isNull);
  });
}
