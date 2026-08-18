import 'package:komplekku/features/announcement/domain/announcement.dart';

class HomeSnapshot {
  const HomeSnapshot({
    required this.firstName,
    required this.communityName,
    required this.houseLabel,
    required this.announcements,
    this.isCached = false,
  });

  final String firstName;
  final String communityName;
  final String houseLabel;
  final List<HomeAnnouncement> announcements;
  final bool isCached;

  factory HomeSnapshot.fromJson(
    Map<String, dynamic> json, {
    bool isCached = false,
  }) {
    final data = json['data'] as Map<String, dynamic>;
    final viewer = data['viewer'] as Map<String, dynamic>;
    final community = data['community'] as Map<String, dynamic>;
    final household = data['household'] as Map<String, dynamic>;
    final house = household['house'] as Map<String, dynamic>;
    final announcements = data['latestAnnouncements'] as List<dynamic>? ?? [];

    return HomeSnapshot(
      firstName: viewer['firstName'] as String,
      communityName: community['name'] as String,
      houseLabel: house['addressLabel'] as String,
      announcements: announcements
          .map((item) => HomeAnnouncement.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      isCached: isCached,
    );
  }
}

class HomeAnnouncement {
  const HomeAnnouncement({
    required this.id,
    required this.title,
    required this.summary,
    required this.badge,
    required this.coverImageUrl,
    required this.publishedAt,
    required this.isRead,
  });

  final String id;
  final String title;
  final String summary;

  /// Derived on the announcement model so the home tile and the noticeboard
  /// row can never disagree about what an announcement is labelled.
  final AnnouncementBadge badge;
  final String? coverImageUrl;
  final DateTime publishedAt;
  final bool isRead;

  factory HomeAnnouncement.fromJson(Map<String, dynamic> json) {
    final summary = AnnouncementSummary.fromJson(json);
    return HomeAnnouncement(
      id: summary.id,
      title: summary.title,
      summary: summary.summary,
      badge: summary.badge,
      coverImageUrl: summary.coverImageUrl,
      publishedAt: summary.publishedAt,
      isRead: summary.isRead,
    );
  }
}
