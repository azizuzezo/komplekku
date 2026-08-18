import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/emergency/domain/emergency.dart';

final emergencyRepositoryProvider = Provider<EmergencyRepository>((ref) {
  return EmergencyRepository(ref.watch(apiClientProvider));
});

/// Incoming SOS signals for the security triage console. Kept separate from
/// [emergencyControllerProvider] (the resident-side send form) because the two
/// screens talk to opposite ends of the same feature.
final emergencyInboxProvider =
    FutureProvider.autoDispose<List<Emergency>>((ref) {
  return ref.watch(emergencyRepositoryProvider).list();
});

class EmergencyRepository {
  EmergencyRepository(this._client);

  final Dio _client;

  Future<Emergency> create({required EmergencyKind kind, String? note}) async {
    return _emergencyRequest(
      () => _client.post<Map<String, dynamic>>(
        '/emergencies',
        data: {
          'kind': emergencyKindToApi(kind),
          if (note != null && note.isNotEmpty) 'note': note,
        },
      ),
    );
  }

  Future<List<Emergency>> list({int limit = 20}) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/emergencies',
        queryParameters: {'limit': limit},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => Emergency.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  /// Security accepts the signal — the step the mobile app was missing, so a
  /// petugas could only watch signals arrive on the web console.
  Future<Emergency> acknowledge(String id) =>
      _transition(id, 'acknowledge');

  Future<Emergency> respond(String id) => _transition(id, 'respond');

  Future<Emergency> resolve(String id) => _transition(id, 'resolve');

  Future<Emergency> _transition(String id, String action) {
    return _emergencyRequest(
      () => _client.post<Map<String, dynamic>>(
        '/emergencies/${Uri.encodeComponent(id)}/$action',
      ),
    );
  }

  Future<Emergency> _emergencyRequest(
    Future<Response<Map<String, dynamic>>> Function() send,
  ) async {
    try {
      final response = await send();
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
