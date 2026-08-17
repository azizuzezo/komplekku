import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/agenda/domain/agenda_event.dart';

enum AgendaView { upcoming, past }

extension on AgendaView {
  String get apiValue => this == AgendaView.upcoming ? 'upcoming' : 'past';
}

final agendaRepositoryProvider = Provider<AgendaRepository>((ref) {
  return AgendaRepository(ref.watch(apiClientProvider));
});

final agendaListProvider = FutureProvider.autoDispose
    .family<List<AgendaEvent>, AgendaView>((ref, view) {
  return ref.watch(agendaRepositoryProvider).list(view);
});

final agendaDetailProvider =
    FutureProvider.autoDispose.family<AgendaEvent, String>((ref, id) {
  return ref.watch(agendaRepositoryProvider).detail(id);
});

class AgendaRepository {
  AgendaRepository(this._client);

  final Dio _client;

  Future<List<AgendaEvent>> list(AgendaView view) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/agenda',
        queryParameters: {'view': view.apiValue, 'limit': 50},
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => AgendaEvent.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<AgendaEvent> detail(String id) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/agenda/${Uri.encodeComponent(id)}',
      );
      final event = response.data?['data']?['event'];
      if (event is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return AgendaEvent.fromJson(event);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<AgendaEvent> create({
    required String title,
    required String date,
    required String startTime,
    required String endTime,
    required String location,
    required String organizer,
    required String description,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/admin/agenda',
        data: {
          'title': title,
          'date': date,
          'startTime': startTime,
          'endTime': endTime,
          'location': location,
          'organizer': organizer,
          'description': description,
        },
      );
      final event = response.data?['data']?['event'];
      if (event is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return AgendaEvent.fromJson(event);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
