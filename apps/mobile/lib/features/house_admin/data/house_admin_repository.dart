import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/house_admin/domain/house_admin.dart';

final houseAdminRepositoryProvider = Provider<HouseAdminRepository>((ref) {
  return HouseAdminRepository(ref.watch(apiClientProvider));
});

final houseAdminListProvider = FutureProvider.autoDispose<List<HouseAdmin>>((ref) {
  return ref.watch(houseAdminRepositoryProvider).list();
});

class HouseAdminRepository {
  HouseAdminRepository(this._client);

  final Dio _client;

  Future<List<HouseAdmin>> list() async {
    try {
      final response = await _client.get<Map<String, dynamic>>('/houses');
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => HouseAdmin.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<HouseAdmin> create({
    required String code,
    required String block,
    required String number,
    required String rtId,
    required OccupancyStatus occupancyStatus,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/houses',
        data: {
          'code': code,
          'block': block,
          'number': number,
          'rtId': rtId,
          'occupancyStatus': occupancyStatusToJson(occupancyStatus),
        },
      );
      final house = response.data?['data']?['house'];
      if (house is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return HouseAdmin.fromJson(house);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<HouseAdmin> updateRt(String houseId, String rtId) async {
    try {
      final response = await _client.patch<Map<String, dynamic>>(
        '/houses/${Uri.encodeComponent(houseId)}',
        data: {'rtId': rtId},
      );
      final house = response.data?['data']?['house'];
      if (house is! Map<String, dynamic>) throw ApiException.malformedResponse();
      return HouseAdmin.fromJson(house);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
