import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';

final sessionApiServiceProvider = Provider<SessionApiService>((ref) {
  return SessionApiService(ref.watch(apiClientProvider));
});

class SessionApiService {
  SessionApiService(this._client);

  final Dio _client;

  Future<Map<String, dynamic>> loadMe() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/me');
      final data = response.data?['data'];
      if (data is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return data;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
