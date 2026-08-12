import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/api/api_client.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/facility/domain/facility.dart';

final facilityRepositoryProvider = Provider<FacilityRepository>((ref) {
  return FacilityRepository(ref.watch(apiClientProvider));
});

final facilityListProvider = FutureProvider.autoDispose<List<Facility>>((
  ref,
) {
  return ref.watch(facilityRepositoryProvider).listFacilities();
});

/// Query for a single facility's schedule on a given day. Records give this
/// family argument structural equality for free, so Riverpod can key the
/// cache without a hand-written `==`/`hashCode`.
typedef FacilityBookingQuery = ({String facilityId, String date});

final facilityBookingListProvider = FutureProvider.autoDispose
    .family<List<FacilityBooking>, FacilityBookingQuery>((ref, query) {
  return ref
      .watch(facilityRepositoryProvider)
      .listBookings(facilityId: query.facilityId, date: query.date);
});

class FacilityRepository {
  FacilityRepository(this._client);

  final Dio _client;

  Future<List<Facility>> listFacilities() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/facilities',
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map((item) => Facility.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<List<FacilityBooking>> listBookings({
    String? facilityId,
    String? date,
  }) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/facility-bookings',
        queryParameters: {
          'facilityId': ?facilityId,
          'date': ?date,
          'limit': 100,
        },
      );
      final items = response.data?['data']?['items'];
      if (items is! List) throw ApiException.malformedResponse();
      return items
          .map(
            (item) => FacilityBooking.fromJson(item as Map<String, dynamic>),
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

  Future<FacilityBooking> createBooking({
    required String facilityId,
    required String bookingDate,
    required String startTime,
    required String endTime,
    String? purpose,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/facility-bookings',
        data: {
          'facilityId': facilityId,
          'bookingDate': bookingDate,
          'startTime': startTime,
          'endTime': endTime,
          if (purpose != null && purpose.trim().isNotEmpty)
            'purpose': purpose.trim(),
        },
      );
      final booking = response.data?['data']?['booking'];
      if (booking is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return FacilityBooking.fromJson(booking);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }

  Future<FacilityBooking> cancelBooking(String id) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/facility-bookings/${Uri.encodeComponent(id)}/cancel',
      );
      final booking = response.data?['data']?['booking'];
      if (booking is! Map<String, dynamic>) {
        throw ApiException.malformedResponse();
      }
      return FacilityBooking.fromJson(booking);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    } on FormatException {
      throw ApiException.malformedResponse();
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
