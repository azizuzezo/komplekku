enum ReportCategory {
  streetLight,
  trash,
  drainage,
  security,
  facility,
  cleanliness,
  noise,
  other,
}

ReportCategory reportCategoryFromApi(Object? value) {
  switch (value) {
    case 'STREET_LIGHT':
      return ReportCategory.streetLight;
    case 'TRASH':
      return ReportCategory.trash;
    case 'DRAINAGE':
      return ReportCategory.drainage;
    case 'SECURITY':
      return ReportCategory.security;
    case 'FACILITY':
      return ReportCategory.facility;
    case 'CLEANLINESS':
      return ReportCategory.cleanliness;
    case 'NOISE':
      return ReportCategory.noise;
    default:
      return ReportCategory.other;
  }
}

String reportCategoryToApi(ReportCategory category) {
  switch (category) {
    case ReportCategory.streetLight:
      return 'STREET_LIGHT';
    case ReportCategory.trash:
      return 'TRASH';
    case ReportCategory.drainage:
      return 'DRAINAGE';
    case ReportCategory.security:
      return 'SECURITY';
    case ReportCategory.facility:
      return 'FACILITY';
    case ReportCategory.cleanliness:
      return 'CLEANLINESS';
    case ReportCategory.noise:
      return 'NOISE';
    case ReportCategory.other:
      return 'OTHER';
  }
}

const Map<ReportCategory, String> reportCategoryLabels = {
  ReportCategory.streetLight: 'Lampu Jalan',
  ReportCategory.trash: 'Sampah',
  ReportCategory.drainage: 'Drainase',
  ReportCategory.security: 'Keamanan',
  ReportCategory.facility: 'Fasilitas',
  ReportCategory.cleanliness: 'Kebersihan',
  ReportCategory.noise: 'Kebisingan',
  ReportCategory.other: 'Lainnya',
};

enum ReportStatus { submitted, received, inProgress, completed }

ReportStatus reportStatusFromApi(Object? value) {
  switch (value) {
    case 'RECEIVED':
      return ReportStatus.received;
    case 'IN_PROGRESS':
      return ReportStatus.inProgress;
    case 'COMPLETED':
      return ReportStatus.completed;
    default:
      return ReportStatus.submitted;
  }
}

String reportStatusToApi(ReportStatus status) {
  switch (status) {
    case ReportStatus.submitted:
      return 'SUBMITTED';
    case ReportStatus.received:
      return 'RECEIVED';
    case ReportStatus.inProgress:
      return 'IN_PROGRESS';
    case ReportStatus.completed:
      return 'COMPLETED';
  }
}

const Map<ReportStatus, String> reportStatusLabels = {
  ReportStatus.submitted: 'Dikirim',
  ReportStatus.received: 'Diterima',
  ReportStatus.inProgress: 'Diproses',
  ReportStatus.completed: 'Selesai',
};

/// Rough visual weight for a status, mirroring the web app's
/// `reportStatusTone` so a mobile status badge reads the same way.
enum ReportStatusTone { muted, warning, success }

ReportStatusTone reportStatusTone(ReportStatus status) {
  switch (status) {
    case ReportStatus.completed:
      return ReportStatusTone.success;
    case ReportStatus.received:
    case ReportStatus.inProgress:
      return ReportStatusTone.warning;
    case ReportStatus.submitted:
      return ReportStatusTone.muted;
  }
}

class ReportUpdateEntry {
  const ReportUpdateEntry({
    required this.id,
    required this.status,
    required this.note,
    required this.actorName,
    required this.createdAt,
  });

  final String id;
  final ReportStatus status;
  final String? note;
  final String? actorName;
  final DateTime createdAt;

  factory ReportUpdateEntry.fromJson(Map<String, dynamic> json) {
    return ReportUpdateEntry(
      id: json['id'] as String,
      status: reportStatusFromApi(json['status']),
      note: json['note'] as String?,
      actorName: json['actorName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class ReportSummary {
  const ReportSummary({
    required this.id,
    required this.category,
    required this.description,
    required this.location,
    required this.status,
    required this.reporterName,
    required this.houseCode,
    required this.householdDisplayName,
    required this.createdAt,
  });

  final String id;
  final ReportCategory category;
  final String description;
  final String? location;
  final ReportStatus status;
  final String reporterName;
  final String houseCode;
  final String householdDisplayName;
  final DateTime createdAt;

  factory ReportSummary.fromJson(Map<String, dynamic> json) {
    return ReportSummary(
      id: json['id'] as String,
      category: reportCategoryFromApi(json['category']),
      description: json['description'] as String,
      location: json['location'] as String?,
      status: reportStatusFromApi(json['status']),
      reporterName: json['reporterName'] as String,
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class ReportDetail {
  const ReportDetail({
    required this.id,
    required this.category,
    required this.description,
    required this.location,
    required this.status,
    required this.reporterName,
    required this.houseCode,
    required this.householdDisplayName,
    required this.createdAt,
    required this.updates,
  });

  final String id;
  final ReportCategory category;
  final String description;
  final String? location;
  final ReportStatus status;
  final String reporterName;
  final String houseCode;
  final String householdDisplayName;
  final DateTime createdAt;
  final List<ReportUpdateEntry> updates;

  factory ReportDetail.fromJson(Map<String, dynamic> json) {
    final updates = json['updates'];
    return ReportDetail(
      id: json['id'] as String,
      category: reportCategoryFromApi(json['category']),
      description: json['description'] as String,
      location: json['location'] as String?,
      status: reportStatusFromApi(json['status']),
      reporterName: json['reporterName'] as String,
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updates: updates is List
          ? updates
              .map(
                (item) => ReportUpdateEntry.fromJson(item as Map<String, dynamic>),
              )
              .toList(growable: false)
          : const [],
    );
  }
}
