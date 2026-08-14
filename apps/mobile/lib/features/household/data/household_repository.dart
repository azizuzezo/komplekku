import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/household/domain/household.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';

final householdRepositoryProvider = Provider<HouseholdRepository>((ref) {
  return HouseholdRepository(ref.watch(apiClientProvider));
});

final currentHouseholdProvider =
    FutureProvider.autoDispose<CurrentHousehold>((ref) {
  return ref.watch(householdRepositoryProvider).loadCurrent();
});

class HouseholdRepository {
  HouseholdRepository(this._client);

  final Dio _client;

  Future<CurrentHousehold> loadCurrent() async {
    try {
      final response =
          await _client.get<Map<String, dynamic>>('/household/current');
      final data = response.data?['data']?['household'];
      if (data is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return CurrentHousehold.fromJson(data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<HouseholdMember> addMember({
    required String fullName,
    required String phone,
    required HouseholdRelationship relationship,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/household/members',
        data: {
          'fullName': fullName,
          'phone': phone,
          'relationship': relationship.apiValue,
        },
      );
      final data = response.data?['data']?['member'];
      if (data is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return HouseholdMember.fromJson(data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> removeMember(String residentId) async {
    try {
      await _client
          .delete<void>('/household/members/${Uri.encodeComponent(residentId)}');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
