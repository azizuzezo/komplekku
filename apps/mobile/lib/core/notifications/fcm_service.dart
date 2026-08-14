import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/notifications/push_notification_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {}

final fcmServiceProvider = Provider<FcmService>((ref) {
  return FcmService(ref.watch(pushNotificationServiceProvider));
});

class FcmService {
  FcmService(this._pushService);

  final PushNotificationService _pushService;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  bool _initialized = false;

  Future<void> initialize({
    required Future<void> Function(String token) onToken,
  }) async {
    if (_initialized) return;
    _initialized = true;

    await _messaging.requestPermission(alert: true, badge: true, sound: true);

    FirebaseMessaging.onMessage.listen((message) async {
      final notification = message.notification;
      if (notification == null) return;
      await _pushService.showNotification(
        id: message.hashCode,
        title: notification.title ?? 'Notifikasi Komplekku',
        body: notification.body ?? '',
        payload: message.data.isNotEmpty ? jsonEncode(message.data) : null,
      );
    });

    final token = await _messaging.getToken();
    if (token != null) await onToken(token);

    _messaging.onTokenRefresh.listen(onToken);
  }
}
