import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/features/auth/data/auth_repository.dart';
import 'package:komplekku/features/auth/data/session_repository.dart';
import 'package:komplekku/features/auth/domain/auth_result.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';
import 'package:komplekku/features/auth/domain/session_snapshot.dart';
import 'package:komplekku/features/auth/presentation/login_controller.dart';

final sessionControllerProvider =
    AsyncNotifierProvider<SessionController, SessionSnapshot?>(
  SessionController.new,
);

class SessionController extends AsyncNotifier<SessionSnapshot?> {
  @override
  Future<SessionSnapshot?> build() {
    return ref.watch(sessionRepositoryProvider).restoreSession();
  }

  void acceptVerifiedSession(VerifiedSession verified) {
    state = AsyncData(
      SessionSnapshot(
        userId: verified.userId,
        displayName: verified.displayName,
        phoneMasked: verified.phoneMasked,
        authState: verified.authState,
        residentStatus: null,
      ),
    );
    ref.invalidate(loginControllerProvider);
  }

  void markPendingApproval() {
    final current = _currentSession;
    if (current == null) return;
    state = AsyncData(
      current.copyWith(
        authState: AuthState.pendingApproval,
        residentStatus: ResidentStatus.pending,
      ),
    );
  }

  Future<SessionSnapshot?> refresh() async {
    final session = await ref.read(sessionRepositoryProvider).restoreSession();
    state = AsyncData(session);
    return session;
  }

  Future<void> retryBootstrap() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      ref.read(sessionRepositoryProvider).restoreSession,
    );
  }

  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).logout();
    ref.invalidate(loginControllerProvider);
    state = const AsyncData(null);
  }

  SessionSnapshot? get _currentSession {
    SessionSnapshot? current;
    state.whenData((value) => current = value);
    return current;
  }
}
