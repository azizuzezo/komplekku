class SecurityDashboardShift {
  const SecurityDashboardShift({required this.id, required this.startedAt});

  final String id;
  final DateTime startedAt;

  factory SecurityDashboardShift.fromJson(Map<String, dynamic> json) {
    return SecurityDashboardShift(
      id: json['id'] as String,
      startedAt: DateTime.parse(json['startedAt'] as String),
    );
  }
}

class SecurityDashboardPatrolSession {
  const SecurityDashboardPatrolSession({
    required this.id,
    required this.startedAt,
    required this.completedCheckpoints,
    required this.totalCheckpoints,
  });

  final String id;
  final DateTime startedAt;
  final int completedCheckpoints;
  final int totalCheckpoints;

  factory SecurityDashboardPatrolSession.fromJson(Map<String, dynamic> json) {
    return SecurityDashboardPatrolSession(
      id: json['id'] as String,
      startedAt: DateTime.parse(json['startedAt'] as String),
      completedCheckpoints: (json['completedCheckpoints'] as num).toInt(),
      totalCheckpoints: (json['totalCheckpoints'] as num).toInt(),
    );
  }
}

/// Read-only ops summary for security staff/admins, mirroring the shape
/// returned by `GET /security/dashboard`
/// (`packages/contracts/src/security-dashboard.ts`).
class SecurityDashboardSnapshot {
  const SecurityDashboardSnapshot({
    required this.activeShift,
    required this.activeVisitorCount,
    required this.pendingPackageCount,
    required this.camerasOnline,
    required this.camerasTotal,
    required this.openEmergencyCount,
    required this.activePatrolSession,
  });

  final SecurityDashboardShift? activeShift;
  final int activeVisitorCount;
  final int pendingPackageCount;
  final int camerasOnline;
  final int camerasTotal;
  final int openEmergencyCount;
  final SecurityDashboardPatrolSession? activePatrolSession;

  factory SecurityDashboardSnapshot.fromJson(Map<String, dynamic> json) {
    final activeShift = json['activeShift'];
    final activePatrolSession = json['activePatrolSession'];
    return SecurityDashboardSnapshot(
      activeShift: activeShift is Map<String, dynamic>
          ? SecurityDashboardShift.fromJson(activeShift)
          : null,
      activeVisitorCount: (json['activeVisitorCount'] as num).toInt(),
      pendingPackageCount: (json['pendingPackageCount'] as num).toInt(),
      camerasOnline: (json['camerasOnline'] as num).toInt(),
      camerasTotal: (json['camerasTotal'] as num).toInt(),
      openEmergencyCount: (json['openEmergencyCount'] as num).toInt(),
      activePatrolSession: activePatrolSession is Map<String, dynamic>
          ? SecurityDashboardPatrolSession.fromJson(activePatrolSession)
          : null,
    );
  }
}
