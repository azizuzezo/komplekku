class ForumMessage {
  const ForumMessage({
    required this.id,
    required this.channelId,
    required this.authorUserId,
    required this.authorName,
    required this.body,
    required this.imageUrls,
    required this.createdAt,
  });

  final String id;
  final String channelId;
  final String authorUserId;
  final String authorName;
  final String body;
  final List<String> imageUrls;
  final DateTime createdAt;

  factory ForumMessage.fromJson(Map<String, dynamic> json) {
    final images = json['imageUrls'];
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
    );
  }
}
