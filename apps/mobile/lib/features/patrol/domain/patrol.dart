enum PatrolSessionStatus { inProgress, completed }

PatrolSessionStatus _statusFromApi(Object? value) {
  return value == 'COMPLETED'
      ? PatrolSessionStatus.completed
      : PatrolSessionStatus.inProgress;
}

extension PatrolSessionStatusLabel on PatrolSessionStatus {
  String get label {
    switch (this) {
      case PatrolSessionStatus.inProgress:
        return 'Berlangsung';
      case PatrolSessionStatus.completed:
        return 'Selesai';
    }
  }
}

class PatrolCheckpoint {
  const PatrolCheckpoint({
    required this.id,
    required this.name,
    required this.displayOrder,
  });

  final String id;
  final String name;
  final int displayOrder;

  factory PatrolCheckpoint.fromJson(Map<String, dynamic> json) {
    return PatrolCheckpoint(
      id: json['id'] as String,
      name: json['name'] as String,
      displayOrder: (json['displayOrder'] as num).toInt(),
    );
  }
}

class PatrolScan {
  const PatrolScan({
    required this.checkpointId,
    required this.checkpointName,
    required this.scannedAt,
    required this.note,
  });

  final String checkpointId;
  final String checkpointName;
  final DateTime scannedAt;
  final String? note;

  factory PatrolScan.fromJson(Map<String, dynamic> json) {
    return PatrolScan(
      checkpointId: json['checkpointId'] as String,
      checkpointName: json['checkpointName'] as String,
      scannedAt: DateTime.parse(json['scannedAt'] as String),
      note: json['note'] as String?,
    );
  }
}

class PatrolSession {
  const PatrolSession({
    required this.id,
    required this.officerName,
    required this.status,
    required this.startedAt,
    required this.endedAt,
    required this.totalCheckpoints,
    required this.scans,
  });

  final String id;
  final String officerName;
  final PatrolSessionStatus status;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int totalCheckpoints;
  final List<PatrolScan> scans;

  factory PatrolSession.fromJson(Map<String, dynamic> json) {
    final scans = json['scans'] as List<dynamic>? ?? const [];
    return PatrolSession(
      id: json['id'] as String,
      officerName: json['officerName'] as String,
      status: _statusFromApi(json['status']),
      startedAt: DateTime.parse(json['startedAt'] as String),
      endedAt: json['endedAt'] != null
          ? DateTime.parse(json['endedAt'] as String)
          : null,
      totalCheckpoints: (json['totalCheckpoints'] as num).toInt(),
      scans: scans
          .map((scan) => PatrolScan.fromJson(scan as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}
