import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/admin_residency/domain/admin_residency_request.dart';

final adminResidencyRepositoryProvider =
    Provider<AdminResidencyRepository>((ref) {
  return AdminResidencyRepository(ref.watch(apiClientProvider));
});

final adminResidencyRequestListProvider =
    FutureProvider.autoDispose<List<AdminResidencyRequest>>((ref) {
  return ref.watch(adminResidencyRepositoryProvider).listPending();
});

class AdminResidencyRepository {
  AdminResidencyRepository(this._client);

  final Dio _client;

  Future<List<AdminResidencyRequest>> listPending({int limit = 100}) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/admin/residency-requests',
        queryParameters: {'limit': limit},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map(
            (item) =>
                AdminResidencyRequest.fromJson(item as Map<String, dynamic>),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<void> approve(String id) async {
    try {
      await _client
          .post<void>('/admin/residency-requests/${Uri.encodeComponent(id)}/approve');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> reject(String id, {required String reason}) async {
    try {
      await _client.post<void>(
        '/admin/residency-requests/${Uri.encodeComponent(id)}/reject',
        data: {'reason': reason},
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
