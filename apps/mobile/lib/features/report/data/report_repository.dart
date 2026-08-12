import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/report/domain/report.dart';

final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  return ReportRepository(ref.watch(apiClientProvider));
});

final reportListProvider = FutureProvider.autoDispose<List<ReportSummary>>((
  ref,
) {
  return ref.watch(reportRepositoryProvider).list();
});

final reportDetailProvider = FutureProvider.autoDispose
    .family<ReportDetail, String>((ref, id) {
  return ref.watch(reportRepositoryProvider).detail(id);
});

class ReportRepository {
  ReportRepository(this._client);

  final Dio _client;

  Future<List<ReportSummary>> list() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/reports',
        queryParameters: const {'limit': 50},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => ReportSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ReportDetail> detail(String id) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/reports/${Uri.encodeComponent(id)}',
      );
      final report = response.data?['data']?['report'];
      if (report is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return ReportDetail.fromJson(report);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ReportDetail> create({
    required ReportCategory category,
    required String description,
    String? location,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/reports',
        data: {
          'category': reportCategoryToApi(category),
          'description': description,
          if (location != null && location.trim().isNotEmpty)
            'location': location.trim(),
        },
      );
      final report = response.data?['data']?['report'];
      if (report is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return ReportDetail.fromJson(report);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<ReportDetail> addUpdate({
    required String id,
    required ReportStatus status,
    String? note,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/reports/${Uri.encodeComponent(id)}/updates',
        data: {
          'status': reportStatusToApi(status),
          if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
        },
      );
      final report = response.data?['data']?['report'];
      if (report is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return ReportDetail.fromJson(report);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
