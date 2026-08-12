import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/invoice/domain/payment.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(ref.watch(apiClientProvider));
});

/// The verification queue mirrors web's default filter
/// (`payment-verification-queue.tsx`'s `statusFilter` starts at `PENDING`):
/// treasurers land on the payments that actually need action.
final paymentQueueProvider = FutureProvider.autoDispose<List<Payment>>((ref) {
  return ref
      .watch(paymentRepositoryProvider)
      .list(status: PaymentStatus.pending);
});

class PaymentRepository {
  PaymentRepository(this._client);

  final Dio _client;

  Future<List<Payment>> list({PaymentStatus? status}) async {
    final queryParameters = <String, dynamic>{'limit': 50};
    if (status != null) queryParameters['status'] = status.apiValue;
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/payments',
        queryParameters: queryParameters,
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => Payment.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Payment> create({
    required String invoiceId,
    required int amount,
    required String paidAt,
    required String note,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/payments',
        data: {
          'invoiceId': invoiceId,
          'amount': amount,
          'paidAt': paidAt,
          'note': note,
        },
      );
      final payment = response.data?['data']?['payment'];
      if (payment is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return Payment.fromJson(payment);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Payment> verify(String id) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/payments/${Uri.encodeComponent(id)}/verify',
      );
      final payment = response.data?['data']?['payment'];
      if (payment is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return Payment.fromJson(payment);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Payment> reject(String id, String reason) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/payments/${Uri.encodeComponent(id)}/reject',
        data: {'reason': reason},
      );
      final payment = response.data?['data']?['payment'];
      if (payment is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return Payment.fromJson(payment);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
