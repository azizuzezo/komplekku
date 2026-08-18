import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';

AnnouncementSummary summaryWith({
  required String priority,
  required String category,
  String? coverImageUrl,
}) {
  return AnnouncementSummary.fromJson({
    'id': 'a1b2c3d4-0000-4000-8000-000000000001',
    'title': 'Kerja Bakti Lingkungan',
    'summary': 'Yuk, bersama-sama jaga kebersihan lingkungan kita.',
    'priority': priority,
    'category': category,
    'coverImageUrl': coverImageUrl,
    'publishedAt': '2026-08-18T07:00:00.000Z',
    'isRead': false,
  });
}

void main() {
  test('urgency wins over filing when choosing the badge', () {
    // An urgent kegiatan must read as "Penting" first — that is what a warga
    // scanning the board needs to notice. Mirrors announcementBadge() in the
    // contracts package.
    expect(
      summaryWith(priority: 'URGENT', category: 'EVENT').badge,
      AnnouncementBadge.important,
    );
    expect(
      summaryWith(priority: 'IMPORTANT', category: 'INFO').badge,
      AnnouncementBadge.important,
    );
  });

  test('normal priority falls back to the stored category', () {
    expect(
      summaryWith(priority: 'NORMAL', category: 'EVENT').badge,
      AnnouncementBadge.event,
    );
    expect(
      summaryWith(priority: 'NORMAL', category: 'INFO').badge,
      AnnouncementBadge.info,
    );
  });

  test('an unknown category degrades to Info rather than throwing', () {
    expect(
      summaryWith(priority: 'NORMAL', category: 'SOMETHING_NEW').badge,
      AnnouncementBadge.info,
    );
  });

  test('a missing cover image stays null so the placeholder can take over', () {
    expect(summaryWith(priority: 'NORMAL', category: 'INFO').coverImageUrl, isNull);
    expect(
      summaryWith(
        priority: 'NORMAL',
        category: 'INFO',
        coverImageUrl: 'https://example.test/cover.jpg',
      ).coverImageUrl,
      'https://example.test/cover.jpg',
    );
  });

  test('every filter and badge has an Indonesian label', () {
    for (final filter in AnnouncementFilter.values) {
      expect(announcementFilterLabels[filter], isNotNull);
    }
    for (final badge in AnnouncementBadge.values) {
      expect(announcementBadgeLabels[badge], isNotNull);
    }
  });
}
