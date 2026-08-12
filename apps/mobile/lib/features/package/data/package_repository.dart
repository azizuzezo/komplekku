import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/package/domain/package.dart';

final packageRepositoryProvider = Provider<PackageRepository>((ref) {
  return PackageRepository(ref.watch(apiClientProvider));
});

final packageListProvider = FutureProvider.autoDispose<List<Package>>((ref) {
  return ref.watch(packageRepositoryProvider).list();
});

class PackageRepository {
  PackageRepository(this._client);

  final Dio _client;

  Future<List<Package>> list({int limit = 20}) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/packages',
        queryParameters: {'limit': limit},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => Package.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
