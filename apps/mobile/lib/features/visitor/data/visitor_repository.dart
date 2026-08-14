import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/visitor/domain/visitor.dart';

final visitorRepositoryProvider = Provider<VisitorRepository>((ref) {
  return VisitorRepository(ref.watch(apiClientProvider));
});

final visitorListProvider = FutureProvider.autoDispose<List<Visitor>>((ref) {
  return ref.watch(visitorRepositoryProvider).list();
});

class VisitorRepository {
  VisitorRepository(this._client);

  final Dio _client;

  Future<List<Visitor>> list({int limit = 20}) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/visitors',
        queryParameters: {'limit': limit},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => Visitor.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Visitor> create({
    required String guestName,
    required String visitDate,
    String? guestPhone,
    String? expectedTime,
    String? vehicleInfo,
    String? plate,
    String? purpose,
    String? notes,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/visitors',
        data: {
          'guestName': guestName,
          'visitDate': visitDate,
          if (guestPhone != null && guestPhone.isNotEmpty)
            'guestPhone': guestPhone,
          if (expectedTime != null && expectedTime.isNotEmpty)
            'expectedTime': expectedTime,
          if (vehicleInfo != null && vehicleInfo.isNotEmpty)
            'vehicleInfo': vehicleInfo,
          if (plate != null && plate.isNotEmpty) 'plate': plate,
          if (purpose != null && purpose.isNotEmpty) 'purpose': purpose,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );
      final visitor = response.data?['data']?['visitor'];
      if (visitor is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return Visitor.fromJson(visitor);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Visitor> createWalkIn({
    required String houseCode,
    required String guestName,
    String? guestPhone,
    String? vehicleInfo,
    String? plate,
    String? purpose,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/visitors/walk-in',
        data: {
          'houseCode': houseCode,
          'guestName': guestName,
          if (guestPhone != null && guestPhone.isNotEmpty)
            'guestPhone': guestPhone,
          if (vehicleInfo != null && vehicleInfo.isNotEmpty)
            'vehicleInfo': vehicleInfo,
          if (plate != null && plate.isNotEmpty) 'plate': plate,
          if (purpose != null && purpose.isNotEmpty) 'purpose': purpose,
        },
      );
      return _requireVisitor(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Visitor?> lookupByQrToken(String qrToken) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/visitors/lookup/${Uri.encodeComponent(qrToken)}',
      );
      final visitor = response.data?['data']?['visitor'];
      if (visitor == null) return null;
      if (visitor is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return Visitor.fromJson(visitor);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Visitor> checkIn(String qrToken) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/visitors/check-in/${Uri.encodeComponent(qrToken)}',
      );
      return _requireVisitor(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<Visitor> checkOut(String id) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/visitors/${Uri.encodeComponent(id)}/check-out',
      );
      return _requireVisitor(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Visitor _requireVisitor(Map<String, dynamic>? data) {
    final visitor = data?['data']?['visitor'];
    if (visitor is! Map<String, dynamic>) throw ApiException.malformedResponse();
    return Visitor.fromJson(visitor);
  }
}
