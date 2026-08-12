import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/api/api_client.dart';

void main() {
  group('resolveApiBaseUrl', () {
    test('adds the API prefix to an Android emulator origin', () {
      expect(
        resolveApiBaseUrl('http://10.0.2.2:3001'),
        'http://10.0.2.2:3001/api/v1',
      );
    });

    test('keeps an explicitly configured API base URL', () {
      expect(
        resolveApiBaseUrl('http://192.168.1.20:3001/api/v1/'),
        'http://192.168.1.20:3001/api/v1',
      );
    });

    test('uses the emulator origin for an empty define', () {
      expect(
        resolveApiBaseUrl('  '),
        'http://10.0.2.2:3001/api/v1',
      );
    });

    test('rejects a value without an HTTP scheme', () {
      expect(
        () => resolveApiBaseUrl('10.0.2.2:3001'),
        throwsArgumentError,
      );
    });

    test('rejects a non-HTTP URL', () {
      expect(
        () => resolveApiBaseUrl('ftp://10.0.2.2:3001'),
        throwsArgumentError,
      );
    });

    test('rejects an unrelated path', () {
      expect(
        () => resolveApiBaseUrl('http://10.0.2.2:3001/internal'),
        throwsArgumentError,
      );
    });
  });
}
