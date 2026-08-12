import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SessionStore {
  SessionStore(this._storage);

  static const _tokenKey = 'komplekku_session_token';
  static const _userIdKey = 'komplekku_session_user_id';
  final FlutterSecureStorage _storage;

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<String?> readUserId() => _storage.read(key: _userIdKey);

  Future<void> writeSession({
    required String token,
    required String userId,
  }) async {
    try {
      await _storage.write(key: _tokenKey, value: token);
      await _storage.write(key: _userIdKey, value: userId);
    } on Exception {
      await clear();
      rethrow;
    }
  }

  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _tokenKey),
      _storage.delete(key: _userIdKey),
    ]);
  }
}
