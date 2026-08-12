import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/emergency/domain/emergency.dart';

final emergencyRepositoryProvider = Provider<EmergencyRepository>((ref) {
  return EmergencyRepository(ref.watch(apiClientProvider));
});

class EmergencyRepository {
  EmergencyRepository(this._client);

  final Dio _client;

  Future<Emergency> create({required EmergencyKind kind, String? note}) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/emergencies',
        data: {
          'kind': emergencyKindToApi(kind),
          if (note != null && note.isNotEmpty) 'note': note,
        },
      );
      final emergency = response.data?['data']?['emergency'];
      if (emergency is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return Emergency.fromJson(emergency);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
