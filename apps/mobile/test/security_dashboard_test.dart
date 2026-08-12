import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/security_dashboard/domain/security_dashboard_snapshot.dart';

void main() {
  test('parses a dashboard snapshot with an active shift and patrol', () {
    final snapshot = SecurityDashboardSnapshot.fromJson({
      'activeShift': {
        'id': 'shift-1',
        'startedAt': '2026-08-11T00:00:00.000Z',
      },
      'activeVisitorCount': 4,
      'pendingPackageCount': 2,
      'camerasOnline': 7,
      'camerasTotal': 8,
      'openEmergencyCount': 0,
      'activePatrolSession': {
        'id': 'session-1',
        'startedAt': '2026-08-11T04:00:00.000Z',
        'completedCheckpoints': 1,
        'totalCheckpoints': 3,
      },
    });

    expect(snapshot.activeShift?.id, 'shift-1');
    expect(snapshot.activeVisitorCount, 4);
    expect(snapshot.camerasOnline, 7);
    expect(snapshot.activePatrolSession?.completedCheckpoints, 1);
  });

  test('parses a dashboard snapshot with no active shift or patrol', () {
    final snapshot = SecurityDashboardSnapshot.fromJson({
      'activeShift': null,
      'activeVisitorCount': 0,
      'pendingPackageCount': 0,
      'camerasOnline': 0,
      'camerasTotal': 8,
      'openEmergencyCount': 1,
      'activePatrolSession': null,
    });

    expect(snapshot.activeShift, isNull);
    expect(snapshot.activePatrolSession, isNull);
    expect(snapshot.openEmergencyCount, 1);
  });
}
