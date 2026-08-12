import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/facility/domain/facility.dart';

void main() {
  test('parses a facility with a nullable capacity and rules', () {
    final facility = Facility.fromJson({
      'id': 'facility-1',
      'name': 'Balai Warga',
      'openTime': '08:00',
      'closeTime': '21:00',
      'capacity': 50,
      'rules': 'Wajib menjaga kebersihan.',
    });

    expect(facility.name, 'Balai Warga');
    expect(facility.capacity, 50);
    expect(facility.rules, 'Wajib menjaga kebersihan.');
  });

  test('parses a facility with null capacity and rules', () {
    final facility = Facility.fromJson({
      'id': 'facility-2',
      'name': 'Lapangan',
      'openTime': '06:00',
      'closeTime': '22:00',
      'capacity': null,
      'rules': null,
    });

    expect(facility.capacity, isNull);
    expect(facility.rules, isNull);
  });

  test('parses a confirmed facility booking', () {
    final booking = FacilityBooking.fromJson({
      'id': 'booking-1',
      'facilityId': 'facility-1',
      'facilityName': 'Balai Warga',
      'bookingDate': '2026-08-15',
      'startTime': '09:00',
      'endTime': '11:00',
      'purpose': 'Rapat RT',
      'status': 'CONFIRMED',
      'bookedByName': 'Budi Santoso',
      'houseCode': 'A-03',
      'householdDisplayName': 'Keluarga Budi',
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(booking.status, FacilityBookingStatus.confirmed);
    expect(booking.bookingDate, '2026-08-15');
    expect(booking.purpose, 'Rapat RT');
  });

  test('parses a cancelled facility booking and a null purpose', () {
    final booking = FacilityBooking.fromJson({
      'id': 'booking-2',
      'facilityId': 'facility-1',
      'facilityName': 'Balai Warga',
      'bookingDate': '2026-08-15',
      'startTime': '13:00',
      'endTime': '14:00',
      'purpose': null,
      'status': 'CANCELLED',
      'bookedByName': 'Siti',
      'houseCode': 'B-01',
      'householdDisplayName': 'Keluarga Siti',
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(booking.status, FacilityBookingStatus.cancelled);
    expect(booking.purpose, isNull);
  });
}
