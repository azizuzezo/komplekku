import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kReleaseMode;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:komplekku/core/auth/session_store.dart';

const _productionApiOrigin = 'https://api.komplekku.duacincin.id';
const _emulatorApiOrigin = 'http://10.0.2.2:3001';

// Release builds (flutter build apk --release) default to production so a
// forgotten --dart-define doesn't silently ship an emulator-only address.
const defaultApiOrigin = kReleaseMode ? _productionApiOrigin : _emulatorApiOrigin;

String resolveApiBaseUrl(String configuredUrl) {
  final normalized = configuredUrl.trim().replaceFirst(RegExp(r'/+$'), '');
  final candidate = normalized.isEmpty ? defaultApiOrigin : normalized;
  final uri = Uri.tryParse(candidate);

  if (uri == null ||
      !{'http', 'https'}.contains(uri.scheme) ||
      uri.host.isEmpty ||
      uri.userInfo.isNotEmpty ||
      uri.hasQuery ||
      uri.hasFragment ||
      (uri.path.isNotEmpty && uri.path != '/api/v1')) {
    throw ArgumentError.value(
      configuredUrl,
      'API_BASE_URL',
      'Gunakan URL HTTP(S) yang valid.',
    );
  }

  return candidate.endsWith('/api/v1') ? candidate : '$candidate/api/v1';
}

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final sessionStoreProvider = Provider<SessionStore>((ref) {
  return SessionStore(ref.watch(secureStorageProvider));
});

final apiClientProvider = Provider<Dio>((ref) {
  final sessionStore = ref.watch(sessionStoreProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: resolveApiBaseUrl(
        const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: defaultApiOrigin,
        ),
      ),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: const {
        'Accept': 'application/json',
        'X-Client-Platform': 'mobile',
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await sessionStore.readToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ),
  );

  return dio;
});
