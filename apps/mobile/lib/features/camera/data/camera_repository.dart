import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/camera/domain/camera.dart';

final cameraRepositoryProvider = Provider<CameraRepository>((ref) {
  return CameraRepository(ref.watch(apiClientProvider));
});

final cameraListProvider = FutureProvider.autoDispose<List<Camera>>((ref) {
  return ref.watch(cameraRepositoryProvider).list();
});

final cameraStreamTicketProvider = FutureProvider.autoDispose
    .family<CameraStreamTicket, String>((ref, cameraId) {
  return ref.watch(cameraRepositoryProvider).issueStreamTicket(cameraId);
});

class CameraRepository {
  CameraRepository(this._client);

  final Dio _client;

  Future<List<Camera>> list() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/cameras');
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => Camera.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<CameraStreamTicket> issueStreamTicket(String cameraId) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/cameras/${Uri.encodeComponent(cameraId)}/stream-ticket',
      );
      final data = response.data?['data'];
      if (data is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return CameraStreamTicket.fromJson(data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
