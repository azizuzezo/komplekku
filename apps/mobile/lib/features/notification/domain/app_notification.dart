class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.readAt,
    required this.createdAt,
    required this.entityType,
    required this.entityId,
  });

  final String id;
  final String title;
  final String message;
  final DateTime? readAt;
  final DateTime createdAt;
  final String entityType;
  final String? entityId;

  bool get isRead => readAt != null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final readAtRaw = json['readAt'];
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      readAt: readAtRaw is String ? DateTime.parse(readAtRaw) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      entityType: json['entityType'] as String,
      entityId: json['entityId'] as String?,
    );
  }

  /// The in-app route this notification should open when tapped, or null when
  /// it has no linked destination (e.g. the entity has since been removed).
  String? get linkedRoute {
    final id = entityId;
    if (id == null || id.isEmpty) return null;
    switch (entityType) {
      case 'ANNOUNCEMENT':
        return '/aktivitas/pengumuman/$id';
      case 'EVENT':
        return '/aktivitas/agenda/$id';
      default:
        return null;
    }
  }
}
