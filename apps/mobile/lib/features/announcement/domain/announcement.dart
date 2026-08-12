enum AnnouncementPriority { normal, important, urgent }

AnnouncementPriority _priorityFromApi(Object? value) {
  switch (value) {
    case 'URGENT':
      return AnnouncementPriority.urgent;
    case 'IMPORTANT':
      return AnnouncementPriority.important;
    default:
      return AnnouncementPriority.normal;
  }
}

class AnnouncementSummary {
  const AnnouncementSummary({
    required this.id,
    required this.title,
    required this.summary,
    required this.priority,
    required this.publishedAt,
    required this.isRead,
  });

  final String id;
  final String title;
  final String summary;
  final AnnouncementPriority priority;
  final DateTime publishedAt;
  final bool isRead;

  factory AnnouncementSummary.fromJson(Map<String, dynamic> json) {
    return AnnouncementSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      summary: json['summary'] as String,
      priority: _priorityFromApi(json['priority']),
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}

class AnnouncementDetail {
  const AnnouncementDetail({
    required this.id,
    required this.title,
    required this.body,
    required this.priority,
    required this.publishedAt,
    required this.isRead,
  });

  final String id;
  final String title;
  final String body;
  final AnnouncementPriority priority;
  final DateTime publishedAt;
  final bool isRead;

  factory AnnouncementDetail.fromJson(Map<String, dynamic> json) {
    return AnnouncementDetail(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      priority: _priorityFromApi(json['priority']),
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}
