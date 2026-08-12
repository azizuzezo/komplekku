import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/onboarding/presentation/onboarding_controller.dart';
import 'package:komplekku/features/onboarding/presentation/widgets/onboarding_scaffold.dart';

class AccountStatusScreen extends ConsumerStatefulWidget {
  const AccountStatusScreen({super.key});

  @override
  ConsumerState<AccountStatusScreen> createState() =>
      _AccountStatusScreenState();
}

class _AccountStatusScreenState extends ConsumerState<AccountStatusScreen> {
  bool _isRefreshing = false;
  bool _isLoggingOut = false;

  Future<void> _refresh() async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    try {
      final previous = _currentAuthState;
      final session =
          await ref.read(sessionControllerProvider.notifier).refresh();
      if (!mounted || session == null) return;
      if (session.authState == previous) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status akunmu belum berubah.')),
        );
      }
    } catch (error) {
      if (!mounted) return;
      _showFailure(error);
    } finally {
      if (mounted) setState(() => _isRefreshing = false);
    }
  }

  Future<void> _logout() async {
    if (_isLoggingOut) return;
    setState(() => _isLoggingOut = true);
    try {
      await ref.read(sessionControllerProvider.notifier).signOut();
      if (mounted) context.go('/masuk');
    } catch (error) {
      if (!mounted) return;
      _showFailure(error);
    } finally {
      if (mounted) setState(() => _isLoggingOut = false);
    }
  }

  AuthState get _currentAuthState {
    var authState = AuthState.accountConfigurationRequired;
    ref.read(sessionControllerProvider).whenData((session) {
      if (session != null) authState = session.authState;
    });
    return authState;
  }

  void _showFailure(Object error) {
    final message = error is ApiException
        ? error.message
        : 'Status akun belum dapat diperiksa. Coba lagi.';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider);
    var authState = AuthState.accountConfigurationRequired;
    session.whenData((value) {
      if (value != null) authState = value.authState;
    });
    final copy = AccountStatusCopy.forState(authState);

    return OnboardingScaffold(
      eyebrow: copy.eyebrow,
      title: copy.title,
      description: copy.description,
      onLogout: _logout,
      isLoggingOut: _isLoggingOut,
      children: [
        Icon(copy.icon, size: 36, semanticLabel: copy.eyebrow),
        const SizedBox(height: 24),
        if (authState == AuthState.rejected) ...[
          FilledButton(
            key: const ValueKey('resubmit-residency'),
            onPressed: () {
              ref.invalidate(onboardingControllerProvider);
              context.go('/mulai/komunitas');
            },
            child: const Text('Ajukan kembali'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _isRefreshing ? null : _refresh,
            icon: const Icon(Icons.refresh),
            label: Text(
              _isRefreshing ? 'Memeriksa status…' : 'Periksa status',
            ),
          ),
        ] else
          FilledButton.icon(
            key: const ValueKey('refresh-account-status'),
            onPressed: _isRefreshing ? null : _refresh,
            icon: const Icon(Icons.refresh),
            label: Text(
              _isRefreshing ? 'Memeriksa status…' : 'Periksa status',
            ),
          ),
      ],
    );
  }
}

class AccountStatusCopy {
  const AccountStatusCopy({
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.icon,
  });

  final String eyebrow;
  final String title;
  final String description;
  final IconData icon;

  factory AccountStatusCopy.forState(AuthState state) {
    return switch (state) {
      AuthState.rejected => const AccountStatusCopy(
          eyebrow: 'Permohonan ditolak',
          title: 'Permohonan belum disetujui',
          description:
              'Alasan penolakan belum tersedia di aplikasi. Kamu dapat memperbaiki data rumah dan mengajukan kembali.',
          icon: Icons.assignment_late_outlined,
        ),
      AuthState.suspended => const AccountStatusCopy(
          eyebrow: 'Akses dihentikan sementara',
          title: 'Akunmu sedang dibatasi',
          description:
              'Komplekku belum dapat membuka data lingkungan untuk akun ini. Periksa status kembali setelah pengurus menanganinya.',
          icon: Icons.pause_circle_outline,
        ),
      AuthState.contextRequired => const AccountStatusCopy(
          eyebrow: 'Kaitan rumah belum lengkap',
          title: 'Pengurus perlu melengkapi konteks rumahmu',
          description:
              'Status warga sudah aktif, tetapi pilihan rumah belum tersedia di aplikasi. Periksa kembali setelah pengurus melengkapi kaitan rumahmu.',
          icon: Icons.home_work_outlined,
        ),
      AuthState.accountConfigurationRequired => const AccountStatusCopy(
          eyebrow: 'Akun perlu diperiksa',
          title: 'Konfigurasi akunmu belum lengkap',
          description:
              'Akses lingkungan belum dapat dibuka sampai data akun diselesaikan oleh pengurus.',
          icon: Icons.manage_accounts_outlined,
        ),
      _ => const AccountStatusCopy(
          eyebrow: 'Status akun',
          title: 'Status akun sedang diperbarui',
          description: 'Periksa kembali status akunmu.',
          icon: Icons.info_outline,
        ),
    };
  }
}
