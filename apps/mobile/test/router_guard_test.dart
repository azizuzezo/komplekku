import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/app/router.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';
import 'package:komplekku/features/auth/domain/session_snapshot.dart';

void main() {
  test('holds navigation at the session gate during bootstrap', () {
    expect(
      redirectForSession(
        const AsyncLoading<SessionSnapshot?>(),
        '/beranda',
      ),
      '/sesi',
    );
    expect(
      redirectForSession(
        const AsyncLoading<SessionSnapshot?>(),
        '/sesi',
      ),
      isNull,
    );
  });

  test('unauthenticated sessions can only reach login', () {
    const session = AsyncData<SessionSnapshot?>(null);
    expect(redirectForSession(session, '/beranda'), '/masuk');
    expect(redirectForSession(session, '/masuk'), isNull);
  });

  test('authenticated sessions are constrained by typed auth state', () {
    const ready = AsyncData<SessionSnapshot?>(
      SessionSnapshot(
        userId: 'user-id',
        displayName: 'Ayu',
        phoneMasked: '+62••••0000',
        authState: AuthState.ready,
        residentStatus: ResidentStatus.active,
      ),
    );
    const pending = AsyncData<SessionSnapshot?>(
      SessionSnapshot(
        userId: 'user-id',
        displayName: 'Ayu',
        phoneMasked: '+62••••0000',
        authState: AuthState.pendingApproval,
        residentStatus: ResidentStatus.pending,
      ),
    );

    expect(redirectForSession(ready, '/beranda'), isNull);
    expect(redirectForSession(ready, '/status-akun'), '/beranda');
    expect(
      redirectForSession(pending, '/beranda'),
      '/menunggu-verifikasi',
    );
  });
}
