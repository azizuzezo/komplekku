import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/notifications/push_notification_service.dart';

final realtimeNotificationServiceProvider =
    Provider<RealtimeNotificationService>((ref) {
  final service = RealtimeNotificationService(
    ref.watch(apiClientProvider),
    ref.watch(pushNotificationServiceProvider),
  );
  ref.onDispose(service.dispose);
  return service;
});

class RealtimeNotificationService {
  RealtimeNotificationService(this._client, this._pushService);

  final Dio _client;
  final PushNotificationService _pushService;

  Timer? _pollingTimer;
  String? _lastNotificationId;
  bool _isPolling = false;

  void startSync({Duration interval = const Duration(seconds: 15)}) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(interval, (_) => _checkNewNotifications());
    // Initial immediate check
    _checkNewNotifications();
  }

  void stopSync() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  void dispose() {
    stopSync();
  }

  Future<void> _checkNewNotifications() async {
    if (_isPolling) return;
    _isPolling = true;

    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/notifications',
        queryParameters: {'limit': 5},
      );

      final data = response.data;
      if (data != null && data['items'] is List) {
        final items = data['items'] as List;
        if (items.isNotEmpty) {
          final latest = items.first as Map<String, dynamic>;
          final latestId = latest['id'] as String?;
          final title = latest['title'] as String? ?? 'Notifikasi Komplekku';
          final body = latest['body'] as String? ?? '';
          final readAt = latest['readAt'];

          // If a new unread notification arrives that wasn't seen in previous poll cycle
          if (latestId != null &&
              latestId != _lastNotificationId &&
              readAt == null) {
            _lastNotificationId = latestId;

            await _pushService.showNotification(
              id: latestId.hashCode,
              title: title,
              body: body,
              payload: latest['entityId'] as String?,
            );
          }
        }
      }
    } catch (_) {
      // Ignore background sync network failures silently
    } finally {
      _isPolling = false;
    }
  }
}
