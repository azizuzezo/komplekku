import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';

final announcementRepositoryProvider = Provider<AnnouncementRepository>((ref) {
  return AnnouncementRepository(ref.watch(apiClientProvider));
});

final announcementListProvider = FutureProvider.autoDispose
    .family<List<AnnouncementSummary>, AnnouncementFilter>((ref, filter) {
  return ref.watch(announcementRepositoryProvider).list(filter);
});

final announcementDetailProvider = FutureProvider.autoDispose
    .family<AnnouncementDetail, String>((ref, id) {
  return ref.watch(announcementRepositoryProvider).detail(id);
});

class AnnouncementRepository {
  AnnouncementRepository(this._client);

  final Dio _client;

  Future<List<AnnouncementSummary>> list([
    AnnouncementFilter filter = AnnouncementFilter.all,
  ]) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/announcements',
        queryParameters: {'limit': 50, 'filter': filter.apiValue},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map(
            (item) => AnnouncementSummary.fromJson(item as Map<String, dynamic>),
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

  Future<AnnouncementDetail> detail(String id) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/announcements/${Uri.encodeComponent(id)}',
      );
      final announcement = response.data?['data']?['announcement'];
      if (announcement is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return AnnouncementDetail.fromJson(announcement);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _client.post<void>('/announcements/${Uri.encodeComponent(id)}/read');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<AnnouncementDetail> create({
    required String title,
    required String summary,
    required String body,
    String priority = 'NORMAL',
    AnnouncementCategory category = AnnouncementCategory.info,
    String? coverImageUrl,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/announcements',
        data: {
          'title': title,
          'summary': summary,
          'body': body,
          'priority': priority,
          'category': category == AnnouncementCategory.event ? 'EVENT' : 'INFO',
          'coverImageUrl': ?coverImageUrl,
        },
      );
      final announcement = response.data?['data']?['announcement'];
      if (announcement is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return AnnouncementDetail.fromJson(announcement);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
