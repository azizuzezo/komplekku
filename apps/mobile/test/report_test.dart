import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/report/domain/report.dart';

void main() {
  test('parses a summary with an in-progress status', () {
    final summary = ReportSummary.fromJson({
      'id': 'report-1',
      'category': 'STREET_LIGHT',
      'description': 'Lampu jalan mati di depan blok A.',
      'location': 'Blok A No. 3',
      'status': 'IN_PROGRESS',
      'reporterName': 'Budi Santoso',
      'houseCode': 'A-03',
      'householdDisplayName': 'Keluarga Budi',
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(summary.category, ReportCategory.streetLight);
    expect(summary.status, ReportStatus.inProgress);
    expect(summary.location, 'Blok A No. 3');
  });

  test('falls back to other category and submitted status for unknown values', () {
    final summary = ReportSummary.fromJson({
      'id': 'report-2',
      'category': 'SOMETHING_NEW',
      'description': 'Masalah lain.',
      'location': null,
      'status': 'SOMETHING_ELSE',
      'reporterName': 'Siti',
      'houseCode': 'B-01',
      'householdDisplayName': 'Keluarga Siti',
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(summary.category, ReportCategory.other);
    expect(summary.status, ReportStatus.submitted);
    expect(summary.location, isNull);
  });

  test('parses detail with an updates timeline', () {
    final detail = ReportDetail.fromJson({
      'id': 'report-1',
      'category': 'TRASH',
      'description': 'Sampah menumpuk.',
      'location': null,
      'status': 'COMPLETED',
      'reporterName': 'Budi Santoso',
      'houseCode': 'A-03',
      'householdDisplayName': 'Keluarga Budi',
      'createdAt': '2026-08-10T04:17:00.000Z',
      'updates': [
        {
          'id': 'update-1',
          'status': 'RECEIVED',
          'note': 'Sudah diterima.',
          'actorName': 'Pengurus',
          'createdAt': '2026-08-10T05:00:00.000Z',
        },
        {
          'id': 'update-2',
          'status': 'COMPLETED',
          'note': null,
          'actorName': null,
          'createdAt': '2026-08-11T05:00:00.000Z',
        },
      ],
    });

    expect(detail.updates, hasLength(2));
    expect(detail.updates.first.status, ReportStatus.received);
    expect(detail.updates.first.note, 'Sudah diterima.');
    expect(detail.updates.last.actorName, isNull);
  });

  test('defaults to an empty updates list when missing', () {
    final detail = ReportDetail.fromJson({
      'id': 'report-3',
      'category': 'NOISE',
      'description': 'Berisik.',
      'location': null,
      'status': 'SUBMITTED',
      'reporterName': 'Ani',
      'houseCode': 'C-02',
      'householdDisplayName': 'Keluarga Ani',
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(detail.updates, isEmpty);
  });

  test('round-trips category and status enums to their API strings', () {
    expect(reportCategoryToApi(ReportCategory.drainage), 'DRAINAGE');
    expect(reportStatusToApi(ReportStatus.inProgress), 'IN_PROGRESS');
    expect(reportStatusTone(ReportStatus.completed), ReportStatusTone.success);
    expect(reportStatusTone(ReportStatus.submitted), ReportStatusTone.muted);
  });
}
