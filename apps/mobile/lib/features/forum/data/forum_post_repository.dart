import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/forum/domain/forum_post.dart';

final forumPostRepositoryProvider = Provider<ForumPostRepository>((ref) {
  return ForumPostRepository(ref.watch(apiClientProvider));
});

/// The board query, as one value so a change of sort or category re-fetches
/// without a second provider.
class ForumBoardQuery {
  const ForumBoardQuery({this.sort = ForumPostSort.latest, this.category});

  final ForumPostSort sort;
  final ForumPostCategory? category;

  ForumBoardQuery copyWith({ForumPostSort? sort, Object? category = _unset}) {
    return ForumBoardQuery(
      sort: sort ?? this.sort,
      category: identical(category, _unset)
          ? this.category
          : category as ForumPostCategory?,
    );
  }

  static const _unset = Object();

  @override
  bool operator ==(Object other) =>
      other is ForumBoardQuery && other.sort == sort && other.category == category;

  @override
  int get hashCode => Object.hash(sort, category);
}

final forumBoardProvider = FutureProvider.autoDispose
    .family<List<ForumPostSummary>, ForumBoardQuery>((ref, query) {
  return ref.watch(forumPostRepositoryProvider).listPosts(query);
});

final forumPostDetailProvider = FutureProvider.autoDispose
    .family<ForumPostDetail, String>((ref, postId) {
  return ref.watch(forumPostRepositoryProvider).detail(postId);
});

class ForumPostRepository {
  ForumPostRepository(this._client);

  final Dio _client;

  Future<List<ForumPostSummary>> listPosts(ForumBoardQuery query) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/forum/posts',
        queryParameters: {
          'sort': query.sort.apiValue,
          'category': ?query.category?.apiValue,
          'limit': 30,
        },
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => ForumPostSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ForumPostDetail> detail(String postId) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/forum/posts/${Uri.encodeComponent(postId)}',
      );
      final post = response.data?['data']?['post'];
      if (post is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return ForumPostDetail.fromJson(post);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ForumPostSummary> createPost({
    required ForumPostCategory category,
    required String title,
    required String body,
    List<String> imageUrls = const [],
  }) async {
    return _postRequest(
      () => _client.post<Map<String, dynamic>>(
        '/forum/posts',
        data: {
          'category': category.apiValue,
          'title': title,
          'body': body,
          'imageUrls': imageUrls,
        },
      ),
    );
  }

  Future<ForumPostSummary> updatePost({
    required String postId,
    ForumPostCategory? category,
    String? title,
    String? body,
  }) async {
    return _postRequest(
      () => _client.patch<Map<String, dynamic>>(
        '/forum/posts/${Uri.encodeComponent(postId)}',
        data: {
          'category': ?category?.apiValue,
          'title': ?title,
          'body': ?body,
        },
      ),
    );
  }

  Future<void> deletePost(String postId) async {
    try {
      await _client.delete<void>('/forum/posts/${Uri.encodeComponent(postId)}');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> togglePostLike(String postId) async {
    try {
      await _client.post<void>('/forum/posts/${Uri.encodeComponent(postId)}/like');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<ForumPostReply> createReply({
    required String postId,
    required String body,
    String? replyToReplyId,
  }) async {
    return _replyRequest(
      () => _client.post<Map<String, dynamic>>(
        '/forum/posts/${Uri.encodeComponent(postId)}/replies',
        data: {'body': body, 'replyToReplyId': ?replyToReplyId},
      ),
    );
  }

  Future<ForumPostReply> updateReply({
    required String replyId,
    required String body,
  }) async {
    return _replyRequest(
      () => _client.patch<Map<String, dynamic>>(
        '/forum/replies/${Uri.encodeComponent(replyId)}',
        data: {'body': body},
      ),
    );
  }

  Future<void> deleteReply(String replyId) async {
    try {
      await _client.delete<void>('/forum/replies/${Uri.encodeComponent(replyId)}');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> toggleReplyLike(String replyId) async {
    try {
      await _client.post<void>('/forum/replies/${Uri.encodeComponent(replyId)}/like');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<ForumPostSummary> _postRequest(
    Future<Response<Map<String, dynamic>>> Function() send,
  ) async {
    try {
      final response = await send();
      final post = response.data?['data']?['post'];
      if (post is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return ForumPostSummary.fromJson(post);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ForumPostReply> _replyRequest(
    Future<Response<Map<String, dynamic>>> Function() send,
  ) async {
    try {
      final response = await send();
      final reply = response.data?['data']?['reply'];
      if (reply is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return ForumPostReply.fromJson(reply);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
