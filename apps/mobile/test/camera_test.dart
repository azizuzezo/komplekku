import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/camera/domain/camera.dart';

void main() {
  test('parses a camera with an offline status and null location', () {
    final camera = Camera.fromJson({
      'id': 'a3f1c2d4-1111-4a2b-9c3d-000000000001',
      'name': 'Gerbang Utama',
      'location': null,
      'accessLevel': 'RESIDENT',
      'status': 'OFFLINE',
      'lastOnlineAt': null,
    });

    expect(camera.location, isNull);
    expect(camera.accessLevel, CameraAccessLevel.resident);
    expect(camera.status, CameraStatus.offline);
    expect(camera.lastOnlineAt, isNull);
  });

  test('parses access levels and a lastOnlineAt timestamp', () {
    final camera = Camera.fromJson({
      'id': 'a3f1c2d4-1111-4a2b-9c3d-000000000002',
      'name': 'Pos Satpam',
      'location': 'Pintu selatan',
      'accessLevel': 'ADMIN_ONLY',
      'status': 'ONLINE',
      'lastOnlineAt': '2026-08-11T04:17:00.000Z',
    });

    expect(camera.accessLevel, CameraAccessLevel.adminOnly);
    expect(camera.status, CameraStatus.online);
    expect(camera.lastOnlineAt, DateTime.parse('2026-08-11T04:17:00.000Z'));
  });

  test('falls back to resident access level for an unknown value', () {
    final camera = Camera.fromJson({
      'id': 'a3f1c2d4-1111-4a2b-9c3d-000000000003',
      'name': 'Kamera Kolam',
      'location': null,
      'accessLevel': 'SOMETHING_NEW',
      'status': 'ONLINE',
      'lastOnlineAt': null,
    });

    expect(camera.accessLevel, CameraAccessLevel.resident);
  });

  test('parses a mock stream ticket response', () {
    final ticket = CameraStreamTicket.fromJson({
      'cameraId': 'a3f1c2d4-1111-4a2b-9c3d-000000000001',
      'mode': 'mock',
      'status': 'ONLINE',
      'ticket': 'mock-ticket-123',
      'expiresAt': '2026-08-11T04:20:00.000Z',
      'watermark': {
        'label': 'KOMPLEKKU',
        'viewerName': 'Budi Santoso',
        'generatedAt': '2026-08-11T04:17:00.000Z',
      },
    });

    expect(ticket.mode, CameraStreamMode.mock);
    expect(ticket.ticket, 'mock-ticket-123');
    expect(ticket.watermark.viewerName, 'Budi Santoso');
    expect(ticket.expiresAt, DateTime.parse('2026-08-11T04:20:00.000Z'));
  });

  test('parses a stream ticket with a null ticket and no expiry', () {
    final ticket = CameraStreamTicket.fromJson({
      'cameraId': 'a3f1c2d4-1111-4a2b-9c3d-000000000001',
      'mode': 'mock',
      'status': 'OFFLINE',
      'ticket': null,
      'expiresAt': null,
      'watermark': {
        'label': 'KOMPLEKKU',
        'viewerName': 'Budi Santoso',
        'generatedAt': '2026-08-11T04:17:00.000Z',
      },
    });

    expect(ticket.ticket, isNull);
    expect(ticket.expiresAt, isNull);
    expect(ticket.status, CameraStatus.offline);
  });
}
