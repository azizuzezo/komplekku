import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/community_admin/domain/community_detail.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';

final communityAdminRepositoryProvider = Provider<CommunityAdminRepository>((ref) {
  return CommunityAdminRepository(ref.watch(apiClientProvider));
});

final currentCommunityProvider = FutureProvider.autoDispose<CommunityDetail>((ref) {
  return ref.watch(communityAdminRepositoryProvider).getCurrentCommunity();
});

final rtListProvider = FutureProvider.autoDispose<List<RtOption>>((ref) {
  return ref.watch(communityAdminRepositoryProvider).listRts();
});

class CommunityAdminRepository {
  CommunityAdminRepository(this._client);

  final Dio _client;

  Future<CommunityDetail> getCurrentCommunity() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/communities/current');
      final community = response.data?['data']?['community'];
      if (community is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return CommunityDetail.fromJson(community);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<CommunityDetail> updateCommunity({
    String? name,
    String? address,
    String? rwLabel,
  }) async {
    try {
      final response = await _client.patch<Map<String, dynamic>>(
        '/admin/community',
        data: {
          'name': ?name,
          'address': ?address,
          'rwLabel': ?rwLabel,
        },
      );
      final community = response.data?['data']?['community'];
      if (community is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return CommunityDetail.fromJson(community);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<List<RtOption>> listRts() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/admin/rts');
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map(
            (item) => _rtFromJson(item as Map<String, dynamic>),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<RtOption> createRt({required String code, required String name}) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/admin/rts',
        data: {'code': code, 'name': name},
      );
      final rt = response.data?['data']?['rt'];
      if (rt is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return _rtFromJson(rt);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<RtOption> updateRt(String rtId, {String? code, String? name}) async {
    try {
      final response = await _client.patch<Map<String, dynamic>>(
        '/admin/rts/${Uri.encodeComponent(rtId)}',
        data: {
          'code': ?code,
          'name': ?name,
        },
      );
      final rt = response.data?['data']?['rt'];
      if (rt is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return _rtFromJson(rt);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  RtOption _rtFromJson(Map<String, dynamic> json) {
    return RtOption(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
    );
  }
}
