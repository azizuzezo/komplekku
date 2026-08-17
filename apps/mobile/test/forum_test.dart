import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/forum/domain/forum_channel.dart';
import 'package:komplekku/features/forum/domain/forum_message.dart';

void main() {
  test('ForumChannel.fromJson parses a community-wide channel with a null rtId', () {
    final channel = ForumChannel.fromJson(const {
      'id': '00000000-0000-4000-8000-000000000301',
      'rtId': null,
      'name': 'Semua Warga',
    });

    expect(channel.id, '00000000-0000-4000-8000-000000000301');
    expect(channel.rtId, isNull);
    expect(channel.name, 'Semua Warga');
  });

  test('ForumChannel.fromJson parses an RT-scoped channel', () {
    final channel = ForumChannel.fromJson(const {
      'id': '00000000-0000-4000-8000-000000000302',
      'rtId': '00000000-0000-4000-8000-000000000010',
      'name': 'RT 01',
    });

    expect(channel.rtId, '00000000-0000-4000-8000-000000000010');
  });

  test('ForumMessage.fromJson parses attached image URLs', () {
    final message = ForumMessage.fromJson({
      'id': '00000000-0000-4000-8000-000000000401',
      'channelId': '00000000-0000-4000-8000-000000000301',
      'authorUserId': '00000000-0000-4000-8000-000000000501',
      'authorName': 'Ayu Pratama',
      'body': 'Ada info penting',
      'imageUrls': const [
        'https://res.cloudinary.com/demo/image/upload/a.jpg',
        'https://res.cloudinary.com/demo/image/upload/b.jpg',
      ],
      'createdAt': '2026-08-17T05:00:00.000Z',
    });

    expect(message.imageUrls, hasLength(2));
    expect(message.imageUrls.first, contains('a.jpg'));
  });

  test('ForumMessage.fromJson defaults imageUrls to an empty list when absent', () {
    final message = ForumMessage.fromJson({
      'id': '00000000-0000-4000-8000-000000000402',
      'channelId': '00000000-0000-4000-8000-000000000301',
      'authorUserId': '00000000-0000-4000-8000-000000000501',
      'authorName': 'Ayu Pratama',
      'body': 'Tanpa lampiran',
      'createdAt': '2026-08-17T05:00:00.000Z',
    });

    expect(message.imageUrls, isEmpty);
  });
}
