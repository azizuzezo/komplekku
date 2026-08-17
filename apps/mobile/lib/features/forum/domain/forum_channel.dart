class ForumChannel {
  const ForumChannel({required this.id, required this.rtId, required this.name});

  final String id;
  final String? rtId;
  final String name;

  factory ForumChannel.fromJson(Map<String, dynamic> json) {
    return ForumChannel(
      id: json['id'] as String,
      rtId: json['rtId'] as String?,
      name: json['name'] as String,
    );
  }
}
