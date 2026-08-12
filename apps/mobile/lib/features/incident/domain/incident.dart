enum IncidentCategory {
  security,
  suspiciousActivity,
  damage,
  noise,
  traffic,
  lostItem,
  emergency,
  other,
}

IncidentCategory _categoryFromApi(Object? value) {
  switch (value) {
    case 'SECURITY':
      return IncidentCategory.security;
    case 'SUSPICIOUS_ACTIVITY':
      return IncidentCategory.suspiciousActivity;
    case 'DAMAGE':
      return IncidentCategory.damage;
    case 'NOISE':
      return IncidentCategory.noise;
    case 'TRAFFIC':
      return IncidentCategory.traffic;
    case 'LOST_ITEM':
      return IncidentCategory.lostItem;
    case 'EMERGENCY':
      return IncidentCategory.emergency;
    default:
      return IncidentCategory.other;
  }
}

extension IncidentCategoryApi on IncidentCategory {
  String toApi() {
    switch (this) {
      case IncidentCategory.security:
        return 'SECURITY';
      case IncidentCategory.suspiciousActivity:
        return 'SUSPICIOUS_ACTIVITY';
      case IncidentCategory.damage:
        return 'DAMAGE';
      case IncidentCategory.noise:
        return 'NOISE';
      case IncidentCategory.traffic:
        return 'TRAFFIC';
      case IncidentCategory.lostItem:
        return 'LOST_ITEM';
      case IncidentCategory.emergency:
        return 'EMERGENCY';
      case IncidentCategory.other:
        return 'OTHER';
    }
  }

  String get label {
    switch (this) {
      case IncidentCategory.security:
        return 'Keamanan';
      case IncidentCategory.suspiciousActivity:
        return 'Aktivitas mencurigakan';
      case IncidentCategory.damage:
        return 'Kerusakan';
      case IncidentCategory.noise:
        return 'Kebisingan';
      case IncidentCategory.traffic:
        return 'Lalu lintas';
      case IncidentCategory.lostItem:
        return 'Barang hilang';
      case IncidentCategory.emergency:
        return 'Darurat';
      case IncidentCategory.other:
        return 'Lainnya';
    }
  }
}

enum IncidentStatus { open, inReview, resolved, closed }

IncidentStatus _statusFromApi(Object? value) {
  switch (value) {
    case 'IN_REVIEW':
      return IncidentStatus.inReview;
    case 'RESOLVED':
      return IncidentStatus.resolved;
    case 'CLOSED':
      return IncidentStatus.closed;
    default:
      return IncidentStatus.open;
  }
}

extension IncidentStatusApi on IncidentStatus {
  String toApi() {
    switch (this) {
      case IncidentStatus.open:
        return 'OPEN';
      case IncidentStatus.inReview:
        return 'IN_REVIEW';
      case IncidentStatus.resolved:
        return 'RESOLVED';
      case IncidentStatus.closed:
        return 'CLOSED';
    }
  }

  String get label {
    switch (this) {
      case IncidentStatus.open:
        return 'Terbuka';
      case IncidentStatus.inReview:
        return 'Ditinjau';
      case IncidentStatus.resolved:
        return 'Selesai';
      case IncidentStatus.closed:
        return 'Ditutup';
    }
  }
}

class IncidentSummary {
  const IncidentSummary({
    required this.id,
    required this.category,
    required this.title,
    required this.location,
    required this.occurredAt,
    required this.status,
    required this.reporterName,
    required this.createdAt,
  });

  final String id;
  final IncidentCategory category;
  final String title;
  final String? location;
  final DateTime occurredAt;
  final IncidentStatus status;
  final String reporterName;
  final DateTime createdAt;

  factory IncidentSummary.fromJson(Map<String, dynamic> json) {
    return IncidentSummary(
      id: json['id'] as String,
      category: _categoryFromApi(json['category']),
      title: json['title'] as String,
      location: json['location'] as String?,
      occurredAt: DateTime.parse(json['occurredAt'] as String),
      status: _statusFromApi(json['status']),
      reporterName: json['reporterName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class IncidentDetail {
  const IncidentDetail({
    required this.id,
    required this.category,
    required this.title,
    required this.location,
    required this.occurredAt,
    required this.status,
    required this.reporterName,
    required this.createdAt,
    required this.description,
    required this.peopleInvolved,
    required this.actionTaken,
  });

  final String id;
  final IncidentCategory category;
  final String title;
  final String? location;
  final DateTime occurredAt;
  final IncidentStatus status;
  final String reporterName;
  final DateTime createdAt;
  final String description;
  final String? peopleInvolved;
  final String? actionTaken;

  factory IncidentDetail.fromJson(Map<String, dynamic> json) {
    return IncidentDetail(
      id: json['id'] as String,
      category: _categoryFromApi(json['category']),
      title: json['title'] as String,
      location: json['location'] as String?,
      occurredAt: DateTime.parse(json['occurredAt'] as String),
      status: _statusFromApi(json['status']),
      reporterName: json['reporterName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      description: json['description'] as String,
      peopleInvolved: json['peopleInvolved'] as String?,
      actionTaken: json['actionTaken'] as String?,
    );
  }
}
