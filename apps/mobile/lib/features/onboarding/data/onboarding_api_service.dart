import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';

final onboardingApiServiceProvider = Provider<OnboardingApiService>((ref) {
  return OnboardingApiService(ref.watch(apiClientProvider));
});

class OnboardingApiService {
  OnboardingApiService(this._client);

  final Dio _client;

  Future<Map<String, dynamic>> loadOptions() async {
    try {
      final response =
          await _client.get<Map<String, dynamic>>('/onboarding/options');
      return _readData(response);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<Map<String, dynamic>> createResidencyRequest({
    required String communityId,
    required String rtId,
    required String houseCode,
    required String fullName,
    required HouseholdRelationship relationship,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/onboarding/residency-requests',
        data: {
          'communityId': communityId,
          'rtId': rtId,
          'houseCode': houseCode.trim(),
          'fullName': fullName.trim(),
          'relationship': relationship.apiValue,
        },
      );
      return _readData(response);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Map<String, dynamic> _readData(
    Response<Map<String, dynamic>> response,
  ) {
    final data = response.data?['data'];
    if (data is! Map<String, dynamic>) {
      throw ApiException.malformedResponse();
    }
    return data;
  }
}
