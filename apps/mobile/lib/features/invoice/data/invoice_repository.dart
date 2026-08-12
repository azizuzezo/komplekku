import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/invoice/domain/invoice.dart';

final invoiceRepositoryProvider = Provider<InvoiceRepository>((ref) {
  return InvoiceRepository(ref.watch(apiClientProvider));
});

final invoiceListProvider = FutureProvider.autoDispose<List<Invoice>>((ref) {
  return ref.watch(invoiceRepositoryProvider).list();
});

final invoiceDetailProvider = FutureProvider.autoDispose
    .family<Invoice, String>((ref, id) {
  return ref.watch(invoiceRepositoryProvider).detail(id);
});

class InvoiceRepository {
  InvoiceRepository(this._client);

  final Dio _client;

  Future<List<Invoice>> list() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/invoices',
        queryParameters: const {'limit': 50},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => Invoice.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Invoice> detail(String id) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/invoices/${Uri.encodeComponent(id)}',
      );
      final invoice = response.data?['data']?['invoice'];
      if (invoice is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return Invoice.fromJson(invoice);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
