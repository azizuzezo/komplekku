import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/security_shift/domain/security_shift.dart';

final securityShiftRepositoryProvider = Provider<SecurityShiftRepository>((ref) {
  return SecurityShiftRepository(ref.watch(apiClientProvider));
});

final activeSecurityShiftProvider =
    FutureProvider.autoDispose<SecurityShift?>((ref) {
  return ref.watch(securityShiftRepositoryProvider).getActive();
});

class SecurityShiftRepository {
  SecurityShiftRepository(this._client);

  final Dio _client;

  Future<SecurityShift?> getActive() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/security/shift');
      final shift = response.data?['data']?['shift'];
      if (shift == null) return null;
      if (shift is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return SecurityShift.fromJson(shift);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<SecurityShift> start() async {
    try {
      final response = await _client.post<Map<String, dynamic>>('/security/shift/start');
      return _requireShift(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<SecurityShift> end({String? notes}) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/security/shift/end',
        data: {
          if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
        },
      );
      return _requireShift(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  SecurityShift _requireShift(Map<String, dynamic>? data) {
    final shift = data?['data']?['shift'];
    if (shift is! Map<String, dynamic>) throw ApiException.malformedResponse();
    return SecurityShift.fromJson(shift);
  }
}
