enum CameraAccessLevel { resident, security, adminOnly }

CameraAccessLevel _accessLevelFromApi(Object? value) {
  switch (value) {
    case 'SECURITY':
      return CameraAccessLevel.security;
    case 'ADMIN_ONLY':
      return CameraAccessLevel.adminOnly;
    default:
      return CameraAccessLevel.resident;
  }
}

enum CameraStatus { online, offline }

CameraStatus _statusFromApi(Object? value) {
  return value == 'ONLINE' ? CameraStatus.online : CameraStatus.offline;
}

class Camera {
  const Camera({
    required this.id,
    required this.name,
    required this.location,
    required this.accessLevel,
    required this.status,
    required this.lastOnlineAt,
  });

  final String id;
  final String name;
  final String? location;
  final CameraAccessLevel accessLevel;
  final CameraStatus status;
  final DateTime? lastOnlineAt;

  factory Camera.fromJson(Map<String, dynamic> json) {
    final lastOnlineAt = json['lastOnlineAt'];
    return Camera(
      id: json['id'] as String,
      name: json['name'] as String,
      location: json['location'] as String?,
      accessLevel: _accessLevelFromApi(json['accessLevel']),
      status: _statusFromApi(json['status']),
      lastOnlineAt:
          lastOnlineAt is String ? DateTime.parse(lastOnlineAt) : null,
    );
  }
}

enum CameraStreamMode { mock, rtsp }

CameraStreamMode _modeFromApi(Object? value) {
  return value == 'rtsp' ? CameraStreamMode.rtsp : CameraStreamMode.mock;
}

class CameraStreamWatermark {
  const CameraStreamWatermark({
    required this.label,
    required this.viewerName,
    required this.generatedAt,
  });

  final String label;
  final String viewerName;
  final DateTime generatedAt;

  factory CameraStreamWatermark.fromJson(Map<String, dynamic> json) {
    return CameraStreamWatermark(
      label: json['label'] as String,
      viewerName: json['viewerName'] as String,
      generatedAt: DateTime.parse(json['generatedAt'] as String),
    );
  }
}

class CameraStreamTicket {
  const CameraStreamTicket({
    required this.cameraId,
    required this.mode,
    required this.status,
    required this.ticket,
    required this.expiresAt,
    required this.watermark,
  });

  final String cameraId;
  final CameraStreamMode mode;
  final CameraStatus status;
  final String? ticket;
  final DateTime? expiresAt;
  final CameraStreamWatermark watermark;

  factory CameraStreamTicket.fromJson(Map<String, dynamic> json) {
    final expiresAt = json['expiresAt'];
    return CameraStreamTicket(
      cameraId: json['cameraId'] as String,
      mode: _modeFromApi(json['mode']),
      status: _statusFromApi(json['status']),
      ticket: json['ticket'] as String?,
      expiresAt: expiresAt is String ? DateTime.parse(expiresAt) : null,
      watermark: CameraStreamWatermark.fromJson(
        json['watermark'] as Map<String, dynamic>,
      ),
    );
  }
}
