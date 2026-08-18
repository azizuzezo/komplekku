enum AnnouncementPriority { normal, important, urgent }

/// How an announcement is filed on the noticeboard — a separate question from
/// how urgent it is ([AnnouncementPriority]).
enum AnnouncementCategory { info, event }

/// The chips above the noticeboard.
enum AnnouncementFilter { all, important, event, info }

/// The single badge an announcement carries. Mirrors `announcementBadge()` in
/// `packages/contracts/src/announcement.ts` — urgency wins over filing, so an
/// urgent kegiatan reads as "Penting" first.
enum AnnouncementBadge { important, event, info }

const announcementBadgeLabels = {
  AnnouncementBadge.important: 'Penting',
  AnnouncementBadge.event: 'Acara',
  AnnouncementBadge.info: 'Info',
};

const announcementFilterLabels = {
  AnnouncementFilter.all: 'Semua',
  AnnouncementFilter.important: 'Penting',
  AnnouncementFilter.event: 'Acara',
  AnnouncementFilter.info: 'Info',
};

extension AnnouncementFilterApi on AnnouncementFilter {
  String get apiValue => name;
}

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

AnnouncementCategory _categoryFromApi(Object? value) =>
    value == 'EVENT' ? AnnouncementCategory.event : AnnouncementCategory.info;

AnnouncementBadge _badgeOf(
  AnnouncementPriority priority,
  AnnouncementCategory category,
) {
  if (priority != AnnouncementPriority.normal) return AnnouncementBadge.important;
  return category == AnnouncementCategory.event
      ? AnnouncementBadge.event
      : AnnouncementBadge.info;
}

class AnnouncementSummary {
  const AnnouncementSummary({
    required this.id,
    required this.title,
    required this.summary,
    required this.priority,
    required this.category,
    required this.coverImageUrl,
    required this.publishedAt,
    required this.isRead,
  });

  final String id;
  final String title;
  final String summary;
  final AnnouncementPriority priority;
  final AnnouncementCategory category;
  final String? coverImageUrl;
  final DateTime publishedAt;
  final bool isRead;

  AnnouncementBadge get badge => _badgeOf(priority, category);

  factory AnnouncementSummary.fromJson(Map<String, dynamic> json) {
    return AnnouncementSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      summary: json['summary'] as String,
      priority: _priorityFromApi(json['priority']),
      category: _categoryFromApi(json['category']),
      coverImageUrl: json['coverImageUrl'] as String?,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}

class AnnouncementDetail {
  const AnnouncementDetail({
    required this.id,
    required this.title,
    required this.summary,
    required this.body,
    required this.priority,
    required this.category,
    required this.coverImageUrl,
    required this.publishedAt,
    required this.isRead,
  });

  final String id;
  final String title;

  /// The one-or-two sentence blurb shown on the board; the edit form needs it
  /// so saving never silently blanks it.
  final String summary;
  final String body;
  final AnnouncementPriority priority;
  final AnnouncementCategory category;
  final String? coverImageUrl;
  final DateTime publishedAt;
  final bool isRead;

  AnnouncementBadge get badge => _badgeOf(priority, category);

  factory AnnouncementDetail.fromJson(Map<String, dynamic> json) {
    return AnnouncementDetail(
      id: json['id'] as String,
      title: json['title'] as String,
      summary: json['summary'] as String? ?? '',
      body: json['body'] as String,
      priority: _priorityFromApi(json['priority']),
      category: _categoryFromApi(json['category']),
      coverImageUrl: json['coverImageUrl'] as String?,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}
