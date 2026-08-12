import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/incident/domain/incident.dart';

final incidentRepositoryProvider = Provider<IncidentRepository>((ref) {
  return IncidentRepository(ref.watch(apiClientProvider));
});

final incidentListProvider =
    FutureProvider.autoDispose<List<IncidentSummary>>((ref) {
  return ref.watch(incidentRepositoryProvider).list();
});

final incidentDetailProvider =
    FutureProvider.autoDispose.family<IncidentDetail, String>((ref, id) {
  return ref.watch(incidentRepositoryProvider).detail(id);
});

class IncidentRepository {
  IncidentRepository(this._client);

  final Dio _client;

  Future<List<IncidentSummary>> list() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/incidents',
        queryParameters: const {'limit': 50},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => IncidentSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<IncidentDetail> detail(String id) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/incidents/${Uri.encodeComponent(id)}',
      );
      final incident = response.data?['data']?['incident'];
      if (incident is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return IncidentDetail.fromJson(incident);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<IncidentDetail> create({
    required IncidentCategory category,
    required String title,
    required String description,
    String? location,
    required DateTime occurredAt,
    String? peopleInvolved,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/incidents',
        data: {
          'category': category.toApi(),
          'title': title,
          'description': description,
          if (location != null && location.trim().isNotEmpty)
            'location': location.trim(),
          'occurredAt': occurredAt.toUtc().toIso8601String(),
          if (peopleInvolved != null && peopleInvolved.trim().isNotEmpty)
            'peopleInvolved': peopleInvolved.trim(),
        },
      );
      final incident = response.data?['data']?['incident'];
      if (incident is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return IncidentDetail.fromJson(incident);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<IncidentDetail> update(
    String id, {
    IncidentStatus? status,
    String? actionTaken,
  }) async {
    try {
      final response = await _client.patch<Map<String, dynamic>>(
        '/incidents/${Uri.encodeComponent(id)}',
        data: {
          if (status != null) 'status': status.toApi(),
          if (actionTaken != null) 'actionTaken': actionTaken.trim(),
        },
      );
      final incident = response.data?['data']?['incident'];
      if (incident is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return IncidentDetail.fromJson(incident);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
