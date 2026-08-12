import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/auth/session_store.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/data/session_api_service.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';
import 'package:komplekku/features/auth/domain/session_snapshot.dart';

final sessionRepositoryProvider = Provider<SessionRepository>((ref) {
  return SessionRepository(
    ref.watch(sessionApiServiceProvider),
    ref.watch(sessionStoreProvider),
  );
});

class SessionRepository {
  SessionRepository(this._service, this._sessionStore);

  final SessionApiService _service;
  final SessionStore _sessionStore;

  Future<SessionSnapshot?> restoreSession() async {
    final String? token;
    try {
      token = await _sessionStore.readToken();
    } on Exception {
      throw const ApiException(
        'LOCAL_STORAGE_UNAVAILABLE',
        'Sesi aman belum dapat dibaca. Tutup lalu buka kembali aplikasi.',
      );
    }

    if (token == null || token.isEmpty) return null;

    try {
      final data = await _service.loadMe();
      return _parseSession(data);
    } on ApiException catch (error) {
      if (!error.isUnauthorized) rethrow;
      try {
        await _sessionStore.clear();
      } on Exception {
        throw const ApiException(
          'SESSION_CLEAR_FAILED',
          'Sesi yang berakhir belum dapat dibersihkan dari perangkat.',
        );
      }
      return null;
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  SessionSnapshot _parseSession(Map<String, dynamic> data) {
    final id = data['id'];
    final phoneMasked = data['phoneMasked'];
    final displayName = data['displayName'];
    if (id is! String ||
        phoneMasked is! String ||
        (displayName != null && displayName is! String)) {
      throw const FormatException('Session identity is invalid.');
    }

    return SessionSnapshot(
      userId: id,
      displayName: displayName as String?,
      phoneMasked: phoneMasked,
      authState: AuthState.fromApi(data['authState']),
      residentStatus: ResidentStatus.fromApi(data['residentStatus']),
    );
  }
}
