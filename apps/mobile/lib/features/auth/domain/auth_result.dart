import 'package:komplekku/features/auth/domain/auth_state.dart';

class OtpChallenge {
  const OtpChallenge({
    required this.requestId,
    required this.expiresAt,
    required this.resendAt,
  });

  final String requestId;
  final DateTime expiresAt;
  final DateTime resendAt;
}

class VerifiedSession {
  const VerifiedSession({
    required this.userId,
    required this.accessToken,
    required this.displayName,
    required this.phoneMasked,
    required this.authState,
    required this.serverNextPath,
  });

  final String userId;
  final String accessToken;
  final String? displayName;
  final String phoneMasked;
  final AuthState authState;

  // Retained for contract visibility only. Navigation uses [authState.route]
  // so an unexpected server path can never become an arbitrary local route.
  final String serverNextPath;
}
