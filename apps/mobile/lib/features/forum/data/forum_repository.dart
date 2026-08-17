import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/forum/domain/forum_channel.dart';
import 'package:komplekku/features/forum/domain/forum_message.dart';

final forumRepositoryProvider = Provider<ForumRepository>((ref) {
  return ForumRepository(ref.watch(apiClientProvider));
});

final forumChannelListProvider =
    FutureProvider.autoDispose<List<ForumChannel>>((ref) {
  return ref.watch(forumRepositoryProvider).listChannels();
});

final forumMessageListProvider = FutureProvider.autoDispose
    .family<List<ForumMessage>, String>((ref, channelId) {
  return ref.watch(forumRepositoryProvider).listMessages(channelId);
});

class ForumRepository {
  ForumRepository(this._client);

  final Dio _client;

  Future<List<ForumChannel>> listChannels() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/forum/channels',
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => ForumChannel.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<List<ForumMessage>> listMessages(String channelId) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/forum/channels/${Uri.encodeComponent(channelId)}/messages',
        queryParameters: const {'limit': 50},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => ForumMessage.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ForumMessage> sendMessage({
    required String channelId,
    required String body,
    List<String> imageUrls = const [],
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/forum/channels/${Uri.encodeComponent(channelId)}/messages',
        data: {'body': body, 'imageUrls': imageUrls},
      );
      final message = response.data?['data']?['message'];
      if (message is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return ForumMessage.fromJson(message);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<void> deleteMessage(String messageId) async {
    try {
      await _client.delete<void>(
        '/forum/messages/${Uri.encodeComponent(messageId)}',
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
