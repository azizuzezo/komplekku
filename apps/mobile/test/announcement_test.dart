import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';

void main() {
  test('parses a summary with an urgent priority', () {
    final summary = AnnouncementSummary.fromJson({
      'id': 'announcement-1',
      'title': '[Demo] Pemadaman listrik sementara',
      'summary': 'Simulasi informasi pemadaman.',
      'priority': 'URGENT',
      'publishedAt': '2026-08-11T04:17:00.000Z',
      'isRead': false,
    });

    expect(summary.priority, AnnouncementPriority.urgent);
    expect(summary.isRead, isFalse);
  });

  test('falls back to normal priority for an unknown value', () {
    final summary = AnnouncementSummary.fromJson({
      'id': 'announcement-2',
      'title': 'Judul',
      'summary': 'Ringkasan.',
      'priority': 'SOMETHING_NEW',
      'publishedAt': '2026-08-11T04:17:00.000Z',
      'isRead': true,
    });

    expect(summary.priority, AnnouncementPriority.normal);
  });

  test('parses full detail body separately from the summary', () {
    final detail = AnnouncementDetail.fromJson({
      'id': 'announcement-1',
      'title': 'Judul',
      'body': 'Isi lengkap pengumuman.',
      'priority': 'IMPORTANT',
      'publishedAt': '2026-08-11T04:17:00.000Z',
      'isRead': false,
    });

    expect(detail.body, 'Isi lengkap pengumuman.');
    expect(detail.priority, AnnouncementPriority.important);
  });
}
