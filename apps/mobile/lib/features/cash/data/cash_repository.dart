import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/cash/domain/cash_transaction.dart';

final cashRepositoryProvider = Provider<CashRepository>((ref) {
  return CashRepository(ref.watch(apiClientProvider));
});

/// Keyed by period (YYYY-MM), mirroring `cash-transparency-view.tsx`'s
/// month picker so switching months re-fetches that month's ledger.
final cashLedgerProvider = FutureProvider.autoDispose
    .family<CashLedgerSnapshot, String>((ref, period) {
  return ref.watch(cashRepositoryProvider).list(period: period);
});

class CashRepository {
  CashRepository(this._client);

  final Dio _client;

  Future<CashLedgerSnapshot> list({String? period, int limit = 50}) async {
    final queryParameters = <String, dynamic>{'limit': limit};
    if (period != null) queryParameters['period'] = period;
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/cash-transactions',
        queryParameters: queryParameters,
      );
      final data = response.data?['data'];
      if (data is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return CashLedgerSnapshot.fromJson(data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<CashTransaction> create({
    required String date,
    required String category,
    required String description,
    required int amount,
    required CashTransactionType type,
    CashVisibility visibility = CashVisibility.publicToResidents,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/cash-transactions',
        data: {
          'date': date,
          'category': category,
          'description': description,
          'amount': amount,
          'type': type.apiValue,
          'visibility': visibility.apiValue,
        },
      );
      final transaction = response.data?['data']?['transaction'];
      if (transaction is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return CashTransaction.fromJson(transaction);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
