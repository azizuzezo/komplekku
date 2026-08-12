import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/auth/session_store.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/domain/auth_result.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(sessionStoreProvider),
  );
});

class AuthRepository {
  AuthRepository(this._client, this._sessionStore);

  final Dio _client;
  final SessionStore _sessionStore;

  Future<OtpChallenge> requestOtp(String phone) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/auth/otp/request',
        data: {'phone': phone.trim()},
      );
      final data = _readData(response);
      return OtpChallenge(
        requestId: data['requestId'] as String,
        expiresAt: DateTime.parse(data['expiresAt'] as String),
        resendAt: DateTime.parse(data['resendAt'] as String),
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<VerifiedSession> verifyOtp({
    required String requestId,
    required String code,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/auth/otp/verify',
        data: {'requestId': requestId, 'code': code.trim()},
      );
      final data = _readData(response);
      final user = data['user'] as Map<String, dynamic>;
      final userId = user['id'] as String;
      final displayName = user['displayName'];
      final phoneMasked = user['phoneMasked'] as String;
      final accessToken = data['accessToken'] as String?;
      final authState = AuthState.fromApi(data['authState']);
      final serverNextPath = data['nextPath'];
      if (userId.isEmpty || phoneMasked.isEmpty) {
        throw const FormatException('User identity is incomplete.');
      }
      if (displayName != null && displayName is! String) {
        throw const FormatException('Display name is invalid.');
      }
      if (serverNextPath is! String || !serverNextPath.startsWith('/')) {
        throw const FormatException('Next path is invalid.');
      }
      if (accessToken == null || accessToken.length < 32) {
        throw const ApiException(
          'MOBILE_SESSION_MISSING',
          'Sesi mobile belum tersedia. Jalankan API terbaru lalu coba lagi.',
        );
      }

      final verified = VerifiedSession(
        userId: userId,
        accessToken: accessToken,
        displayName: displayName,
        phoneMasked: phoneMasked,
        authState: authState,
        serverNextPath: serverNextPath,
      );

      // Validate the complete response before any credential reaches secure storage.
      try {
        await _sessionStore.writeSession(
          token: accessToken,
          userId: userId,
        );
      } on Exception {
        throw const ApiException(
          'SESSION_SAVE_FAILED',
          'Sesi aman belum dapat disimpan di perangkat. Coba lagi.',
        );
      }
      return verified;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<void> logout() async {
    try {
      await _client.post<void>('/auth/logout');
    } on Exception {
      // Local credentials must still be removed when the server is unreachable.
    }

    try {
      await _sessionStore.clear();
    } on Exception {
      throw const ApiException(
        'SESSION_CLEAR_FAILED',
        'Sesi lokal belum dapat dihapus. Coba keluar lagi.',
      );
    }
  }

  Map<String, dynamic> _readData(
    Response<Map<String, dynamic>> response,
  ) {
    final data = response.data?['data'];
    if (data is! Map<String, dynamic>) {
      throw ApiException.malformedResponse();
    }
    return data;
  }
}
