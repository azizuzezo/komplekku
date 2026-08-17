import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/onboarding/data/api_onboarding_repository.dart';
import 'package:komplekku/features/onboarding/data/onboarding_api_service.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';

void main() {
  test('maps onboarding options without exposing house enumeration', () async {
    final repository = ApiOnboardingRepository(
      _FakeOnboardingApiService(
        options: {
          'communities': [
            {
              'id': '00000000-0000-4000-8000-000000000001',
              'name': 'Billabong Blok F',
              'slug': 'billabong-blok-f',
              'timezone': 'Asia/Jakarta',
            },
          ],
        },
      ),
    );

    final communities = await repository.loadCommunities();

    expect(communities, hasLength(1));
    expect(communities.single.name, 'Billabong Blok F');
  });

  test('maps the created pending residency request', () async {
    final service = _FakeOnboardingApiService(
      options: const {'communities': <Object>[]},
      request: {
        'request': {
          'id': '00000000-0000-4000-8000-000000000201',
          'status': 'PENDING',
          'fullName': 'Ayu Pratama',
          'relationship': 'TENANT',
          'submittedAt': '2026-08-11T05:00:00.000Z',
          'community': {
            'id': '00000000-0000-4000-8000-000000000001',
            'name': 'Billabong Blok F',
            'slug': 'billabong-blok-f',
            'timezone': 'Asia/Jakarta',
          },
          'house': {
            'id': '00000000-0000-4000-8000-000000000101',
            'code': 'F01',
            'block': 'F1',
            'number': '12',
            'addressLabel': 'F1 No. 12',
          },
        },
      },
    );
    final repository = ApiOnboardingRepository(service);

    final request = await repository.submitResidencyRequest(
      communityId: '00000000-0000-4000-8000-000000000001',
      rtId: '00000000-0000-4000-8000-000000000f01',
      houseCode: 'f01',
      fullName: 'Ayu Pratama',
      relationship: HouseholdRelationship.tenant,
    );

    expect(request.status, ResidencyRequestStatus.pending);
    expect(request.house.code, 'F01');
    expect(request.relationship, HouseholdRelationship.tenant);
    expect(service.submittedHouseCode, 'f01');
  });

  test('maps malformed onboarding data to a resident-safe failure', () async {
    final repository = ApiOnboardingRepository(
      _FakeOnboardingApiService(options: const {'communities': 'invalid'}),
    );

    await expectLater(
      repository.loadCommunities(),
      throwsA(
        isA<ApiException>().having(
          (error) => error.code,
          'code',
          'INVALID_RESPONSE',
        ),
      ),
    );
  });
}

class _FakeOnboardingApiService extends OnboardingApiService {
  _FakeOnboardingApiService({required this.options, this.request})
      : super(Dio());

  final Map<String, dynamic> options;
  final Map<String, dynamic>? request;
  String? submittedHouseCode;

  @override
  Future<Map<String, dynamic>> loadOptions() async => options;

  @override
  Future<Map<String, dynamic>> createResidencyRequest({
    required String communityId,
    required String rtId,
    required String houseCode,
    required String fullName,
    required HouseholdRelationship relationship,
  }) async {
    submittedHouseCode = houseCode;
    return request!;
  }
}
