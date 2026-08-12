import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/agenda/domain/agenda_event.dart';

void main() {
  test('parses an event and formats its Indonesian date label', () {
    final event = AgendaEvent.fromJson({
      'id': 'event-1',
      'title': '[Demo] Kerja bakti lingkungan',
      'date': '2026-08-13',
      'startTime': '07:00',
      'endTime': '09:00',
      'location': 'Taman Blok F',
      'description': 'Simulasi agenda warga.',
      'organizer': 'Pengurus RT',
    });

    expect(event.dateLabel, '13 Agu 2026');
    expect(event.timeRangeLabel, '07:00–09:00');
  });

  test('falls back to the raw date string when it cannot be parsed', () {
    final event = AgendaEvent.fromJson({
      'id': 'event-2',
      'title': 'Judul',
      'date': 'not-a-date',
      'startTime': '07:00',
      'endTime': '09:00',
      'location': 'Lokasi',
      'description': 'Deskripsi.',
      'organizer': 'Pengurus',
    });

    expect(event.dateLabel, 'not-a-date');
  });
}
