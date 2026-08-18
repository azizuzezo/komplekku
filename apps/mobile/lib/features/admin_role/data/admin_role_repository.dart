import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/admin_role/domain/admin_role_models.dart';

final adminRoleRepositoryProvider = Provider<AdminRoleRepository>((ref) {
  return AdminRoleRepository(ref.watch(apiClientProvider));
});

final roleListProvider = FutureProvider.autoDispose<List<RoleOption>>((ref) {
  return ref.watch(adminRoleRepositoryProvider).listRoles();
});

final communityMemberListProvider = FutureProvider.autoDispose<List<CommunityMember>>((ref) {
  return ref.watch(adminRoleRepositoryProvider).listMembers();
});

class AdminRoleRepository {
  AdminRoleRepository(this._client);

  final Dio _client;

  Future<List<RoleOption>> listRoles() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/admin/roles');
      final roles = response.data?['data']?['roles'];
      if (roles is! List) throw ApiException.malformedResponse();
      return roles
          .map((role) => RoleOption.fromJson(role as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<List<CommunityMember>> listMembers() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/admin/users');
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => CommunityMember.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<void> setMemberRole({
    required String residentId,
    required String roleCode,
    String? rtId,
  }) async {
    try {
      await _client.patch<Map<String, dynamic>>(
        '/admin/users/${Uri.encodeComponent(residentId)}/role',
        data: {
          'roleCode': roleCode,
          'rtId': ?rtId,
        },
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
