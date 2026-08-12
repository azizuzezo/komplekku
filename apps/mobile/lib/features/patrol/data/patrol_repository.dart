import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/patrol/domain/patrol.dart';

final patrolRepositoryProvider = Provider<PatrolRepository>((ref) {
  return PatrolRepository(ref.watch(apiClientProvider));
});

final patrolCheckpointListProvider =
    FutureProvider.autoDispose<List<PatrolCheckpoint>>((ref) {
  return ref.watch(patrolRepositoryProvider).listCheckpoints();
});

final patrolHistoryProvider =
    FutureProvider.autoDispose<List<PatrolSession>>((ref) {
  return ref.watch(patrolRepositoryProvider).listHistory();
});

class PatrolRepository {
  PatrolRepository(this._client);

  final Dio _client;

  Future<List<PatrolCheckpoint>> listCheckpoints() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/patrol/checkpoints',
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => PatrolCheckpoint.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<PatrolSession?> getActiveSession() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/patrol/session',
      );
      final session = response.data?['data']?['session'];
      if (session == null) return null;
      if (session is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return PatrolSession.fromJson(session);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<PatrolSession> startSession() async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/patrol/session/start',
      );
      return _requireSession(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<PatrolSession> scanCheckpoint({
    required String qrToken,
    String? note,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/patrol/session/scan',
        data: {
          'qrToken': qrToken,
          if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
        },
      );
      return _requireSession(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<PatrolSession?> endSession() async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/patrol/session/end',
      );
      final session = response.data?['data']?['session'];
      if (session == null) return null;
      if (session is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return PatrolSession.fromJson(session);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<List<PatrolSession>> listHistory({int limit = 20}) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/patrol/history',
        queryParameters: {'limit': limit},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => PatrolSession.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  PatrolSession _requireSession(Map<String, dynamic>? data) {
    final session = data?['data']?['session'];
    if (session is! Map<String, dynamic>) {
      throw ApiException.malformedResponse();
    }
    return PatrolSession.fromJson(session);
  }
}
