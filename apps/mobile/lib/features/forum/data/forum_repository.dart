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

final forumChannelMemberListProvider = FutureProvider.autoDispose
    .family<List<ForumChannelMember>, String>((ref, channelId) {
  return ref.watch(forumRepositoryProvider).listMembers(channelId);
});

/// Residents who can be invited into a private forum.
final forumMemberCandidateListProvider =
    FutureProvider.autoDispose<List<ForumMemberCandidate>>((ref) {
  return ref.watch(forumRepositoryProvider).listMemberCandidates();
});

class ForumRepository {
  ForumRepository(this._client);

  final Dio _client;

  Future<List<ForumChannel>> listChannels() {
    return _listRequest(
      () => _client.get<Map<String, dynamic>>('/forum/channels'),
      ForumChannel.fromJson,
    );
  }

  Future<ForumChannel> createChannel({
    required String name,
    String? description,
    List<String> invitedUserIds = const [],
  }) {
    return _channelRequest(
      () => _client.post<Map<String, dynamic>>(
        '/forum/channels',
        data: {
          'name': name,
          if (description != null && description.isNotEmpty)
            'description': description,
          'invitedUserIds': invitedUserIds,
        },
      ),
    );
  }

  Future<List<ForumChannelMember>> listMembers(String channelId) {
    return _listRequest(
      () => _client.get<Map<String, dynamic>>(
        '/forum/channels/${Uri.encodeComponent(channelId)}/members',
      ),
      ForumChannelMember.fromJson,
    );
  }

  Future<List<ForumMemberCandidate>> listMemberCandidates() {
    return _listRequest(
      () => _client.get<Map<String, dynamic>>('/forum/member-candidates'),
      ForumMemberCandidate.fromJson,
    );
  }

  Future<ForumChannel> inviteMembers({
    required String channelId,
    required List<String> userIds,
  }) {
    return _channelRequest(
      () => _client.post<Map<String, dynamic>>(
        '/forum/channels/${Uri.encodeComponent(channelId)}/invitations',
        data: {'userIds': userIds},
      ),
    );
  }

  Future<ForumChannel> respondToInvitation({
    required String channelId,
    required bool accept,
  }) {
    return _channelRequest(
      () => _client.post<Map<String, dynamic>>(
        '/forum/channels/${Uri.encodeComponent(channelId)}/invitation',
        data: {'accept': accept},
      ),
    );
  }

  Future<List<ForumMessage>> listMessages(String channelId) {
    return _listRequest(
      () => _client.get<Map<String, dynamic>>(
        '/forum/channels/${Uri.encodeComponent(channelId)}/messages',
        queryParameters: const {'limit': 50},
      ),
      ForumMessage.fromJson,
    );
  }

  Future<ForumMessage> sendMessage({
    required String channelId,
    required String body,
    List<String> imageUrls = const [],
    String? replyToMessageId,
  }) {
    return _messageRequest(
      () => _client.post<Map<String, dynamic>>(
        '/forum/channels/${Uri.encodeComponent(channelId)}/messages',
        data: {
          'body': body,
          'imageUrls': imageUrls,
          'replyToMessageId': ?replyToMessageId,
        },
      ),
    );
  }

  Future<ForumMessage> editMessage({
    required String messageId,
    required String body,
  }) {
    return _messageRequest(
      () => _client.patch<Map<String, dynamic>>(
        '/forum/messages/${Uri.encodeComponent(messageId)}',
        data: {'body': body},
      ),
    );
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

  Future<List<T>> _listRequest<T>(
    Future<Response<Map<String, dynamic>>> Function() send,
    T Function(Map<String, dynamic> json) parse,
  ) async {
    try {
      final response = await send();
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => parse(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ForumChannel> _channelRequest(
    Future<Response<Map<String, dynamic>>> Function() send,
  ) async {
    try {
      final response = await send();
      final channel = response.data?['data']?['channel'];
      if (channel is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return ForumChannel.fromJson(channel);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ForumMessage> _messageRequest(
    Future<Response<Map<String, dynamic>>> Function() send,
  ) async {
    try {
      final response = await send();
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
}
