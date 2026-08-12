import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/onboarding/presentation/widgets/onboarding_scaffold.dart';

class PendingVerificationScreen extends ConsumerStatefulWidget {
  const PendingVerificationScreen({super.key});

  @override
  ConsumerState<PendingVerificationScreen> createState() =>
      _PendingVerificationScreenState();
}

class _PendingVerificationScreenState
    extends ConsumerState<PendingVerificationScreen> {
  bool _isRefreshing = false;
  bool _isLoggingOut = false;

  Future<void> _refresh() async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    try {
      final session =
          await ref.read(sessionControllerProvider.notifier).refresh();
      if (!mounted || session == null) return;
      if (session.authState == AuthState.pendingApproval) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Permohonanmu masih menunggu verifikasi.'),
          ),
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

  void _showFailure(Object error) {
    final message = error is ApiException
        ? error.message
        : 'Status belum dapat diperiksa. Coba lagi.';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return OnboardingScaffold(
      eyebrow: 'Verifikasi warga',
      title: 'Permohonanmu sedang diperiksa',
      description:
          'Pengurus akan mencocokkan data rumah sebelum akses lingkungan dibuka.',
      onLogout: _logout,
      isLoggingOut: _isLoggingOut,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: KomplekkuColors.surfaceSoft,
            border: Border.all(color: KomplekkuColors.border),
            borderRadius: const BorderRadius.all(Radius.circular(10)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.schedule_outlined, color: KomplekkuColors.primary),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Belum ada tindakan lain yang perlu kamu lakukan. Periksa status kembali setelah pengurus meninjau permohonan.',
                  style: TextStyle(height: 1.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          key: const ValueKey('refresh-pending-status'),
          onPressed: _isRefreshing ? null : _refresh,
          icon: const Icon(Icons.refresh),
          label: Text(_isRefreshing ? 'Memeriksa status…' : 'Periksa status'),
        ),
      ],
    );
  }
}
