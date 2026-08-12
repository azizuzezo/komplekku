import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/notification/domain/app_notification.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(apiClientProvider));
});

final notificationListProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) {
  return ref.watch(notificationRepositoryProvider).list();
});

final unreadNotificationCountProvider =
    FutureProvider.autoDispose<int>((ref) {
  return ref.watch(notificationRepositoryProvider).unreadCount();
});

class NotificationRepository {
  NotificationRepository(this._client);

  final Dio _client;

  Future<List<AppNotification>> list() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/notifications',
        queryParameters: const {'limit': 50},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map(
            (item) => AppNotification.fromJson(item as Map<String, dynamic>),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<int> unreadCount() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/notifications/unread-count',
      );
      final count = response.data?['data']?['unreadCount'];
      if (count is! int) throw ApiException.malformedResponse();
      return count;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _client.post<void>('/notifications/${Uri.encodeComponent(id)}/read');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> markAllRead() async {
    try {
      await _client.post<void>('/notifications/read-all');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
