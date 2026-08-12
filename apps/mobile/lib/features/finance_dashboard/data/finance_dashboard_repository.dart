import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/finance_dashboard/domain/finance_dashboard.dart';

final financeDashboardRepositoryProvider =
    Provider<FinanceDashboardRepository>((ref) {
  return FinanceDashboardRepository(ref.watch(apiClientProvider));
});

final financeDashboardProvider =
    FutureProvider.autoDispose<FinanceDashboard>((ref) {
  return ref.watch(financeDashboardRepositoryProvider).load();
});

class FinanceDashboardRepository {
  FinanceDashboardRepository(this._client);

  final Dio _client;

  Future<FinanceDashboard> load() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/finance/dashboard',
      );
      final data = response.data?['data'];
      if (data is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return FinanceDashboard.fromJson(data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
