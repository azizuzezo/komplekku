import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/data/auth_repository.dart';
import 'package:komplekku/features/auth/domain/auth_result.dart';

final loginControllerProvider = NotifierProvider<LoginController, LoginState>(
  LoginController.new,
  isAutoDispose: true,
);

class LoginState {
  const LoginState({
    this.challenge,
    this.isSubmitting = false,
    this.errorMessage,
  });

  final OtpChallenge? challenge;
  final bool isSubmitting;
  final String? errorMessage;
}

class LoginController extends Notifier<LoginState> {
  @override
  LoginState build() => const LoginState();

  Future<OtpChallenge?> requestOtp(String phone) async {
    if (state.isSubmitting) return null;
    state = LoginState(challenge: state.challenge, isSubmitting: true);

    try {
      final challenge = await ref.read(authRepositoryProvider).requestOtp(phone);
      state = LoginState(challenge: challenge);
      return challenge;
    } catch (error) {
      state = LoginState(
        challenge: state.challenge,
        errorMessage: _messageFor(error),
      );
      return null;
    }
  }

  Future<VerifiedSession?> verifyOtp(String code) async {
    final challenge = state.challenge;
    if (challenge == null || state.isSubmitting) return null;
    state = LoginState(challenge: challenge, isSubmitting: true);

    try {
      final verified = await ref.read(authRepositoryProvider).verifyOtp(
            requestId: challenge.requestId,
            code: code,
          );
      state = LoginState(challenge: challenge);
      return verified;
    } catch (error) {
      state = LoginState(
        challenge: challenge,
        errorMessage: _messageFor(error),
      );
      return null;
    }
  }

  void resetPhone() {
    if (state.isSubmitting) return;
    state = const LoginState();
  }

  String _messageFor(Object error) {
    return switch (error) {
      ApiException(:final message) => message,
      _ => 'Terjadi kendala saat memproses permintaan. Coba lagi.',
    };
  }
}
