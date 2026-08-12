import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/letter/domain/letter.dart';

void main() {
  test('parses a letter type with a null description', () {
    final type = LetterType.fromJson({
      'id': 'type-1',
      'name': 'Surat Keterangan Domisili',
      'description': null,
    });

    expect(type.name, 'Surat Keterangan Domisili');
    expect(type.description, isNull);
  });

  test('parses a submitted letter request with nullable review fields', () {
    final request = LetterRequest.fromJson({
      'id': 'letter-1',
      'letterTypeId': 'type-1',
      'letterTypeName': 'Surat Keterangan Domisili',
      'purpose': 'Melengkapi dokumen bank.',
      'status': 'SUBMITTED',
      'requesterName': 'Budi Santoso',
      'houseCode': 'A-03',
      'householdDisplayName': 'Keluarga Budi',
      'reviewedByName': null,
      'reviewedAt': null,
      'rejectionReason': null,
      'readyAt': null,
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(request.status, LetterRequestStatus.submitted);
    expect(request.reviewedAt, isNull);
    expect(request.readyAt, isNull);
    expect(
      letterRequestStatusTone(request.status),
      LetterStatusTone.muted,
    );
  });

  test('parses a rejected letter request with a reason and review metadata', () {
    final request = LetterRequest.fromJson({
      'id': 'letter-2',
      'letterTypeId': 'type-1',
      'letterTypeName': 'Surat Keterangan Domisili',
      'purpose': 'Melengkapi dokumen bank.',
      'status': 'REJECTED',
      'requesterName': 'Siti',
      'houseCode': 'B-01',
      'householdDisplayName': 'Keluarga Siti',
      'reviewedByName': 'Pengurus RT',
      'reviewedAt': '2026-08-12T04:17:00.000Z',
      'rejectionReason': 'Data tidak lengkap.',
      'readyAt': null,
      'createdAt': '2026-08-11T04:17:00.000Z',
    });

    expect(request.status, LetterRequestStatus.rejected);
    expect(request.reviewedByName, 'Pengurus RT');
    expect(request.reviewedAt, DateTime.parse('2026-08-12T04:17:00.000Z'));
    expect(request.rejectionReason, 'Data tidak lengkap.');
    expect(
      letterRequestStatusTone(request.status),
      LetterStatusTone.danger,
    );
  });

  test('falls back to submitted status for an unknown value', () {
    final status = letterRequestStatusFromApi('SOMETHING_NEW');
    expect(status, LetterRequestStatus.submitted);
  });
}
