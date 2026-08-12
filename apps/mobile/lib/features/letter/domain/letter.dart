enum LetterRequestStatus { submitted, approved, rejected, ready }

LetterRequestStatus letterRequestStatusFromApi(Object? value) {
  switch (value) {
    case 'APPROVED':
      return LetterRequestStatus.approved;
    case 'REJECTED':
      return LetterRequestStatus.rejected;
    case 'READY':
      return LetterRequestStatus.ready;
    default:
      return LetterRequestStatus.submitted;
  }
}

const Map<LetterRequestStatus, String> letterRequestStatusLabels = {
  LetterRequestStatus.submitted: 'Diajukan',
  LetterRequestStatus.approved: 'Disetujui',
  LetterRequestStatus.rejected: 'Ditolak',
  LetterRequestStatus.ready: 'Dokumen siap',
};

/// Rough visual weight for a status, mirroring the web app's
/// `statusBadgeVariant` so a mobile status badge reads the same way.
enum LetterStatusTone { muted, warning, success, danger }

LetterStatusTone letterRequestStatusTone(LetterRequestStatus status) {
  switch (status) {
    case LetterRequestStatus.submitted:
      return LetterStatusTone.muted;
    case LetterRequestStatus.approved:
      return LetterStatusTone.warning;
    case LetterRequestStatus.ready:
      return LetterStatusTone.success;
    case LetterRequestStatus.rejected:
      return LetterStatusTone.danger;
  }
}

class LetterType {
  const LetterType({
    required this.id,
    required this.name,
    required this.description,
  });

  final String id;
  final String name;
  final String? description;

  factory LetterType.fromJson(Map<String, dynamic> json) {
    return LetterType(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
    );
  }
}

class LetterRequest {
  const LetterRequest({
    required this.id,
    required this.letterTypeId,
    required this.letterTypeName,
    required this.purpose,
    required this.status,
    required this.requesterName,
    required this.houseCode,
    required this.householdDisplayName,
    required this.reviewedByName,
    required this.reviewedAt,
    required this.rejectionReason,
    required this.readyAt,
    required this.createdAt,
  });

  final String id;
  final String letterTypeId;
  final String letterTypeName;
  final String purpose;
  final LetterRequestStatus status;
  final String requesterName;
  final String houseCode;
  final String householdDisplayName;
  final String? reviewedByName;
  final DateTime? reviewedAt;
  final String? rejectionReason;
  final DateTime? readyAt;
  final DateTime createdAt;

  factory LetterRequest.fromJson(Map<String, dynamic> json) {
    final reviewedAt = json['reviewedAt'] as String?;
    final readyAt = json['readyAt'] as String?;
    return LetterRequest(
      id: json['id'] as String,
      letterTypeId: json['letterTypeId'] as String,
      letterTypeName: json['letterTypeName'] as String,
      purpose: json['purpose'] as String,
      status: letterRequestStatusFromApi(json['status']),
      requesterName: json['requesterName'] as String,
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      reviewedByName: json['reviewedByName'] as String?,
      reviewedAt: reviewedAt != null ? DateTime.parse(reviewedAt) : null,
      rejectionReason: json['rejectionReason'] as String?,
      readyAt: readyAt != null ? DateTime.parse(readyAt) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
