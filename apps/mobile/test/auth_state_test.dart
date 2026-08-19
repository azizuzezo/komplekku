import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';

void main() {
  test('maps every API auth state to an allowlisted resident route', () {
    expect(AuthState.fromApi('READY').route, '/beranda');
    expect(
      AuthState.fromApi('NEEDS_RESIDENCY').route,
      '/mulai/komunitas',
    );
    expect(
      AuthState.fromApi('PENDING_APPROVAL').route,
      '/menunggu-verifikasi',
    );
    expect(AuthState.fromApi('CONTEXT_REQUIRED').route, '/status-akun');
    expect(AuthState.fromApi('REJECTED').route, '/status-akun');
    expect(AuthState.fromApi('SUSPENDED').route, '/status-akun');
    expect(
      AuthState.fromApi('ACCOUNT_CONFIGURATION_REQUIRED').route,
      '/status-akun',
    );
  });

  test('only rejected residents can re-enter residency onboarding', () {
    expect(
      AuthState.rejected.allowsPath('/mulai/komunitas'),
      isTrue,
    );
    expect(
      AuthState.suspended.allowsPath('/mulai/komunitas'),
      isFalse,
    );
    expect(AuthState.ready.allowsPath('/status-akun'), isFalse);
  });

  test('a ready resident can reach every bottom-navigation destination', () {
    expect(AuthState.ready.allowsPath('/beranda'), isTrue);
    expect(AuthState.ready.allowsPath('/shalat'), isTrue);
    expect(AuthState.ready.allowsPath('/pengumuman'), isTrue);
    expect(AuthState.ready.allowsPath('/pengumuman/abc-123'), isTrue);
    expect(AuthState.ready.allowsPath('/forum'), isTrue);
    expect(AuthState.ready.allowsPath('/layanan'), isTrue);
    expect(AuthState.pendingApproval.allowsPath('/pengumuman'), isFalse);
  });

  test('Profil and Keamanan stay reachable even without a bottom tab', () {
    // Profil moved from the fifth bottom tab to the header account icon, and
    // Keamanan never had its own tab — both must keep their existing paths so
    // deep links and notification payloads still resolve.
    expect(AuthState.ready.allowsPath('/akun'), isTrue);
    expect(AuthState.ready.allowsPath('/keamanan'), isTrue);
    expect(AuthState.ready.allowsPath('/keamanan/cctv'), isTrue);
    expect(AuthState.ready.allowsPath('/layanan/iuran'), isTrue);
    expect(AuthState.ready.allowsPath('/layanan/komunitas'), isTrue);
    expect(AuthState.ready.allowsPath('/layanan/pengguna'), isTrue);
    expect(AuthState.ready.allowsPath('/agenda'), isTrue);
    expect(AuthState.ready.allowsPath('/agenda/abc-123'), isTrue);
    expect(AuthState.ready.allowsPath('/kalender'), isTrue);
    expect(AuthState.ready.allowsPath('/notifikasi'), isTrue);
  });

  test('rejects unknown server auth states', () {
    expect(() => AuthState.fromApi('UNKNOWN'), throwsFormatException);
    expect(() => AuthState.fromApi(null), throwsFormatException);
  });
}
