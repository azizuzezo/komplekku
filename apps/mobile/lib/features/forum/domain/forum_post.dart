/// What a discussion-board post is for. Chat channels have no equivalent —
/// this only applies to the threaded board.
enum ForumPostCategory { question, suggestion, information, environment, activity }

/// `answered` keeps only posts that already have at least one reply, so a
/// warga can skip past the questions nobody has picked up yet.
enum ForumPostSort { latest, popular, answered }

const forumPostCategoryLabels = {
  ForumPostCategory.question: 'Tanya Warga',
  ForumPostCategory.suggestion: 'Usulan',
  ForumPostCategory.information: 'Informasi',
  ForumPostCategory.environment: 'Info Lingkungan',
  ForumPostCategory.activity: 'Ide & Kegiatan',
};

const forumPostSortLabels = {
  ForumPostSort.latest: 'Terbaru',
  ForumPostSort.popular: 'Populer',
  ForumPostSort.answered: 'Terjawab',
};

extension ForumPostCategoryApi on ForumPostCategory {
  String get apiValue => switch (this) {
        ForumPostCategory.question => 'QUESTION',
        ForumPostCategory.suggestion => 'SUGGESTION',
        ForumPostCategory.information => 'INFORMATION',
        ForumPostCategory.environment => 'ENVIRONMENT',
        ForumPostCategory.activity => 'ACTIVITY',
      };
}

extension ForumPostSortApi on ForumPostSort {
  String get apiValue => name;
}

ForumPostCategory forumPostCategoryFromApi(Object? value) {
  switch (value) {
    case 'QUESTION':
      return ForumPostCategory.question;
    case 'SUGGESTION':
      return ForumPostCategory.suggestion;
    case 'ENVIRONMENT':
      return ForumPostCategory.environment;
    case 'ACTIVITY':
      return ForumPostCategory.activity;
    default:
      return ForumPostCategory.information;
  }
}

class ForumPostSummary {
  const ForumPostSummary({
    required this.id,
    required this.category,
    required this.title,
    required this.excerpt,
    required this.imageUrls,
    required this.replyCount,
    required this.authorUserId,
    required this.authorName,
    required this.createdAt,
    required this.editedAt,
    required this.likeCount,
    required this.likedByMe,
  });

  final String id;
  final ForumPostCategory category;
  final String title;
  final String excerpt;
  final List<String> imageUrls;
  final int replyCount;
  final String authorUserId;
  final String authorName;
  final DateTime createdAt;
  final DateTime? editedAt;
  final int likeCount;

  /// The heart is per-person, so this cannot be derived from [likeCount].
  final bool likedByMe;

  bool get isEdited => editedAt != null;

  factory ForumPostSummary.fromJson(Map<String, dynamic> json) {
    final images = json['imageUrls'];
    final editedAt = json['editedAt'];
    return ForumPostSummary(
      id: json['id'] as String,
      category: forumPostCategoryFromApi(json['category']),
      title: json['title'] as String,
      excerpt: json['excerpt'] as String? ?? '',
      imageUrls: images is List
          ? images.map((url) => url as String).toList(growable: false)
          : const [],
      replyCount: (json['replyCount'] as num?)?.toInt() ?? 0,
      authorUserId: json['authorUserId'] as String,
      authorName: json['authorName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      editedAt: editedAt is String ? DateTime.parse(editedAt) : null,
      likeCount: (json['likeCount'] as num?)?.toInt() ?? 0,
      likedByMe: json['likedByMe'] as bool? ?? false,
    );
  }
}

class ForumPostReply {
  const ForumPostReply({
    required this.id,
    required this.postId,
    required this.body,
    required this.replyToReplyId,
    required this.replyToAuthorName,
    required this.replyToBody,
    required this.authorUserId,
    required this.authorName,
    required this.createdAt,
    required this.editedAt,
    required this.likeCount,
    required this.likedByMe,
  });

  final String id;
  final String postId;
  final String body;
  final String? replyToReplyId;

  /// Denormalised quote of the reply being answered; null when it was deleted,
  /// so the thread never resurrects removed content.
  final String? replyToAuthorName;
  final String? replyToBody;
  final String authorUserId;
  final String authorName;
  final DateTime createdAt;
  final DateTime? editedAt;
  final int likeCount;
  final bool likedByMe;

  bool get isQuote => replyToReplyId != null;
  bool get isEdited => editedAt != null;

  factory ForumPostReply.fromJson(Map<String, dynamic> json) {
    final editedAt = json['editedAt'];
    return ForumPostReply(
      id: json['id'] as String,
      postId: json['postId'] as String,
      body: json['body'] as String,
      replyToReplyId: json['replyToReplyId'] as String?,
      replyToAuthorName: json['replyToAuthorName'] as String?,
      replyToBody: json['replyToBody'] as String?,
      authorUserId: json['authorUserId'] as String,
      authorName: json['authorName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      editedAt: editedAt is String ? DateTime.parse(editedAt) : null,
      likeCount: (json['likeCount'] as num?)?.toInt() ?? 0,
      likedByMe: json['likedByMe'] as bool? ?? false,
    );
  }
}

class ForumPostDetail {
  const ForumPostDetail({required this.post, required this.body, required this.replies});

  final ForumPostSummary post;
  final String body;
  final List<ForumPostReply> replies;

  factory ForumPostDetail.fromJson(Map<String, dynamic> json) {
    final replies = json['replies'];
    return ForumPostDetail(
      post: ForumPostSummary.fromJson(json),
      body: json['body'] as String,
      replies: replies is List
          ? replies
              .map((item) => ForumPostReply.fromJson(item as Map<String, dynamic>))
              .toList(growable: false)
          : const [],
    );
  }
}

/// "5 jam yang lalu" — the board reads as a conversation, so relative time is
/// more useful here than a timestamp.
String formatForumRelativeTime(DateTime value) {
  final elapsed = DateTime.now().difference(value);
  if (elapsed.inMinutes < 1) return 'baru saja';
  if (elapsed.inMinutes < 60) return '${elapsed.inMinutes} menit yang lalu';
  if (elapsed.inHours < 24) return '${elapsed.inHours} jam yang lalu';
  if (elapsed.inDays < 30) return '${elapsed.inDays} hari yang lalu';

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  final local = value.toLocal();
  return '${local.day} ${months[local.month - 1]} ${local.year}';
}
