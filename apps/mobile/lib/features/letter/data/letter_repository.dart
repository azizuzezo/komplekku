import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/letter/domain/letter.dart';

final letterRepositoryProvider = Provider<LetterRepository>((ref) {
  return LetterRepository(ref.watch(apiClientProvider));
});

final letterTypeListProvider = FutureProvider.autoDispose<List<LetterType>>((
  ref,
) {
  return ref.watch(letterRepositoryProvider).listTypes();
});

final letterRequestListProvider =
    FutureProvider.autoDispose<List<LetterRequest>>((ref) {
  return ref.watch(letterRepositoryProvider).list();
});

class LetterRepository {
  LetterRepository(this._client);

  final Dio _client;

  Future<List<LetterType>> listTypes() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/letter-types',
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => LetterType.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<List<LetterRequest>> list() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/letters',
        queryParameters: const {'limit': 50},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => LetterRequest.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<LetterRequest> create({
    required String letterTypeId,
    required String purpose,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/letters',
        data: {'letterTypeId': letterTypeId, 'purpose': purpose},
      );
      final request = response.data?['data']?['request'];
      if (request is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return LetterRequest.fromJson(request);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<LetterRequest> approve(String id) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/letters/${Uri.encodeComponent(id)}/approve',
      );
      final request = response.data?['data']?['request'];
      if (request is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return LetterRequest.fromJson(request);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<LetterRequest> reject(String id, String reason) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/letters/${Uri.encodeComponent(id)}/reject',
        data: {'reason': reason},
      );
      final request = response.data?['data']?['request'];
      if (request is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return LetterRequest.fromJson(request);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<LetterRequest> markReady(String id) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/letters/${Uri.encodeComponent(id)}/ready',
      );
      final request = response.data?['data']?['request'];
      if (request is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return LetterRequest.fromJson(request);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
