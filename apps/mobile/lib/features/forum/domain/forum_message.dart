class ForumMessage {
  const ForumMessage({
    required this.id,
    required this.channelId,
    required this.authorUserId,
    required this.authorName,
    required this.body,
    required this.imageUrls,
    required this.createdAt,
    required this.editedAt,
    required this.replyToMessageId,
    required this.replyToAuthorName,
    required this.replyToBody,
  });

  final String id;
  final String channelId;
  final String authorUserId;
  final String authorName;
  final String body;
  final List<String> imageUrls;
  final DateTime createdAt;
  final DateTime? editedAt;

  final String? replyToMessageId;

  /// Denormalised quote of the parent message so a reply renders without a
  /// second round-trip; both null when the parent was deleted.
  final String? replyToAuthorName;
  final String? replyToBody;

  bool get isReply => replyToMessageId != null;
  bool get isEdited => editedAt != null;

  factory ForumMessage.fromJson(Map<String, dynamic> json) {
    final images = json['imageUrls'];
    final editedAt = json['editedAt'];
    return ForumMessage(
      id: json['id'] as String,
      channelId: json['channelId'] as String,
      authorUserId: json['authorUserId'] as String,
      authorName: json['authorName'] as String,
      body: json['body'] as String,
      imageUrls: images is List
          ? images.map((url) => url as String).toList(growable: false)
          : const [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      editedAt: editedAt is String ? DateTime.parse(editedAt) : null,
      replyToMessageId: json['replyToMessageId'] as String?,
      replyToAuthorName: json['replyToAuthorName'] as String?,
      replyToBody: json['replyToBody'] as String?,
    );
  }
}
