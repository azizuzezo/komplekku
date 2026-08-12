import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/patrol/domain/patrol.dart';

void main() {
  test('parses a patrol checkpoint', () {
    final checkpoint = PatrolCheckpoint.fromJson({
      'id': 'checkpoint-1',
      'name': 'Gerbang utama',
      'displayOrder': 1,
    });

    expect(checkpoint.name, 'Gerbang utama');
    expect(checkpoint.displayOrder, 1);
  });

  test('parses a scan with a note', () {
    final scan = PatrolScan.fromJson({
      'checkpointId': 'checkpoint-1',
      'checkpointName': 'Gerbang utama',
      'scannedAt': '2026-08-11T04:17:00.000Z',
      'note': 'Aman.',
    });

    expect(scan.checkpointName, 'Gerbang utama');
    expect(scan.note, 'Aman.');
  });

  test('parses an in-progress session with no end time', () {
    final session = PatrolSession.fromJson({
      'id': 'session-1',
      'officerName': 'Petugas Jaga',
      'status': 'IN_PROGRESS',
      'startedAt': '2026-08-11T04:00:00.000Z',
      'endedAt': null,
      'totalCheckpoints': 3,
      'scans': [
        {
          'checkpointId': 'checkpoint-1',
          'checkpointName': 'Gerbang utama',
          'scannedAt': '2026-08-11T04:05:00.000Z',
          'note': null,
        },
      ],
    });

    expect(session.status, PatrolSessionStatus.inProgress);
    expect(session.endedAt, isNull);
    expect(session.scans, hasLength(1));
    expect(session.scans.single.note, isNull);
  });

  test('parses a completed session with an end time', () {
    final session = PatrolSession.fromJson({
      'id': 'session-2',
      'officerName': 'Petugas Jaga',
      'status': 'COMPLETED',
      'startedAt': '2026-08-11T04:00:00.000Z',
      'endedAt': '2026-08-11T05:00:00.000Z',
      'totalCheckpoints': 2,
      'scans': [],
    });

    expect(session.status, PatrolSessionStatus.completed);
    expect(session.endedAt, isNotNull);
    expect(session.scans, isEmpty);
  });
}
