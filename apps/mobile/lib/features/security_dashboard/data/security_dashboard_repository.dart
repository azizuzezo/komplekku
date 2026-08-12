import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/security_dashboard/domain/security_dashboard_snapshot.dart';

final securityDashboardRepositoryProvider =
    Provider<SecurityDashboardRepository>((ref) {
  return SecurityDashboardRepository(ref.watch(apiClientProvider));
});

final securityDashboardProvider =
    FutureProvider.autoDispose<SecurityDashboardSnapshot>((ref) {
  return ref.watch(securityDashboardRepositoryProvider).load();
});

class SecurityDashboardRepository {
  SecurityDashboardRepository(this._client);

  final Dio _client;

  Future<SecurityDashboardSnapshot> load() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/security/dashboard',
      );
      final data = response.data?['data'];
      if (data is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return SecurityDashboardSnapshot.fromJson(data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
