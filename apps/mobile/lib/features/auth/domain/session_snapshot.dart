import 'package:komplekku/features/auth/domain/auth_state.dart';

enum ResidentStatus {
  pending('PENDING'),
  active('ACTIVE'),
  rejected('REJECTED'),
  suspended('SUSPENDED'),
  movedOut('MOVED_OUT');

  const ResidentStatus(this.apiValue);

  final String apiValue;

  static ResidentStatus? fromApi(Object? value) {
    if (value == null) return null;
    if (value is! String) {
      throw const FormatException('Resident status is invalid.');
    }

    for (final status in values) {
      if (status.apiValue == value) return status;
    }
    throw FormatException('Unsupported resident status: $value');
  }
}

class SessionSnapshot {
  const SessionSnapshot({
    required this.userId,
    required this.displayName,
    required this.phoneMasked,
    required this.authState,
    required this.residentStatus,
  });

  final String userId;
  final String? displayName;
  final String phoneMasked;
  final AuthState authState;
  final ResidentStatus? residentStatus;

  SessionSnapshot copyWith({
    AuthState? authState,
    ResidentStatus? residentStatus,
  }) {
    return SessionSnapshot(
      userId: userId,
      displayName: displayName,
      phoneMasked: phoneMasked,
      authState: authState ?? this.authState,
      residentStatus: residentStatus ?? this.residentStatus,
    );
  }
}
