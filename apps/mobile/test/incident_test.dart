import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/incident/domain/incident.dart';

void main() {
  test('parses a summary with a known category and status', () {
    final summary = IncidentSummary.fromJson({
      'id': 'incident-1',
      'category': 'SUSPICIOUS_ACTIVITY',
      'title': 'Orang tak dikenal di area parkir',
      'location': 'Blok A',
      'occurredAt': '2026-08-11T04:17:00.000Z',
      'status': 'IN_REVIEW',
      'reporterName': 'Budi Santoso',
      'createdAt': '2026-08-11T04:20:00.000Z',
    });

    expect(summary.category, IncidentCategory.suspiciousActivity);
    expect(summary.status, IncidentStatus.inReview);
    expect(summary.location, 'Blok A');
  });

  test('falls back to OTHER category for an unknown value', () {
    final summary = IncidentSummary.fromJson({
      'id': 'incident-2',
      'category': 'SOMETHING_NEW',
      'title': 'Judul',
      'location': null,
      'occurredAt': '2026-08-11T04:17:00.000Z',
      'status': 'SOMETHING_ELSE',
      'reporterName': 'Siti',
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(summary.category, IncidentCategory.other);
    expect(summary.status, IncidentStatus.open);
    expect(summary.location, isNull);
  });

  test('parses a detail payload including nullable fields', () {
    final detail = IncidentDetail.fromJson({
      'id': 'incident-1',
      'category': 'DAMAGE',
      'title': 'Pagar rusak',
      'location': 'Blok B',
      'occurredAt': '2026-08-11T04:17:00.000Z',
      'status': 'RESOLVED',
      'reporterName': 'Petugas Jaga',
      'createdAt': '2026-08-11T04:17:00.000Z',
      'description': 'Pagar rusak akibat kecelakaan.',
      'peopleInvolved': null,
      'actionTaken': 'Sudah diperbaiki oleh tukang.',
    });

    expect(detail.description, 'Pagar rusak akibat kecelakaan.');
    expect(detail.peopleInvolved, isNull);
    expect(detail.actionTaken, 'Sudah diperbaiki oleh tukang.');
    expect(detail.status, IncidentStatus.resolved);
  });

  test('category and status expose Indonesian labels and round-trip to API values', () {
    expect(IncidentCategory.emergency.label, 'Darurat');
    expect(IncidentCategory.emergency.toApi(), 'EMERGENCY');
    expect(IncidentStatus.closed.label, 'Ditutup');
    expect(IncidentStatus.closed.toApi(), 'CLOSED');
  });
}
