enum AuthState {
  needsResidency('NEEDS_RESIDENCY'),
  pendingApproval('PENDING_APPROVAL'),
  ready('READY'),
  contextRequired('CONTEXT_REQUIRED'),
  rejected('REJECTED'),
  suspended('SUSPENDED'),
  accountConfigurationRequired('ACCOUNT_CONFIGURATION_REQUIRED');

  const AuthState(this.apiValue);

  final String apiValue;

  static AuthState fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Auth state is missing.');
    }

    for (final state in values) {
      if (state.apiValue == value) return state;
    }
    throw FormatException('Unsupported auth state: $value');
  }

  String get route => switch (this) {
        AuthState.ready => '/beranda',
        AuthState.needsResidency => '/mulai/komunitas',
        AuthState.pendingApproval => '/menunggu-verifikasi',
        AuthState.contextRequired => '/status-akun',
        AuthState.rejected => '/status-akun',
        AuthState.suspended => '/status-akun',
        AuthState.accountConfigurationRequired => '/status-akun',
      };

  static const _readyDestinations = [
    '/beranda',
    '/shalat',
    '/pengumuman',
    '/agenda',
    '/kalender',
    '/notifikasi',
    '/forum',
    // Keamanan and Layanan kept their paths when they moved under the Profil
    // tab, so their deep links stay valid.
    '/keamanan',
    '/layanan',
    '/akun',
  ];

  bool allowsPath(String path) {
    if (path == route) return true;

    if (this == AuthState.ready) {
      // The bottom-navigation shell has several sibling destinations besides
      // '/beranda', plus their own nested/detail routes (e.g.
      // '/pengumuman/<id>', '/keamanan/cctv').
      return _readyDestinations.any(
        (destination) =>
            path == destination || path.startsWith('$destination/'),
      );
    }

    // The API explicitly allows a rejected request to be corrected and sent
    // again. No other non-canonical onboarding path is permitted.
    return this == AuthState.rejected && path == '/mulai/komunitas';
  }
}
