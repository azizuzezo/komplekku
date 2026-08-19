import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/komplekku_logo.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_error_state.dart';

/// Bootstrap gate — same Split Studio identity language as the login screen
/// (lockup logo), so the app doesn't switch brand treatment mid-flow.
class SessionGateScreen extends ConsumerWidget {
  const SessionGateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    return Scaffold(
      backgroundColor: AppColors.brandCanvas,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: session.when(
            data: (_) => const _SessionLoading(),
            loading: () => const _SessionLoading(),
            error: (error, _) => _SessionFailure(
              error: error,
              onRetry: () => ref
                  .read(sessionControllerProvider.notifier)
                  .retryBootstrap(),
              onSignOut: () => ref
                  .read(sessionControllerProvider.notifier)
                  .signOut(),
            ),
          ),
        ),
      ),
    );
  }
}

class _SessionLoading extends StatelessWidget {
  const _SessionLoading();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Semantics(
        label: 'Memeriksa sesi Komplekku',
        liveRegion: true,
        child: const ExcludeSemantics(
          child: KomplekkuLogo(
            variant: KomplekkuLogoVariant.lockup,
            width: 200,
          ),
        ),
      ),
    );
  }
}

class _SessionFailure extends StatefulWidget {
  const _SessionFailure({
    required this.error,
    required this.onRetry,
    required this.onSignOut,
  });

  final Object error;
  final Future<void> Function() onRetry;
  final Future<void> Function() onSignOut;

  @override
  State<_SessionFailure> createState() => _SessionFailureState();
}

class _SessionFailureState extends State<_SessionFailure> {
  bool _isWorking = false;

  Future<void> _run(Future<void> Function() action) async {
    if (_isWorking) return;
    setState(() => _isWorking = true);
    try {
      await action();
    } catch (error) {
      if (!mounted) return;
      final message = error is ApiException
          ? error.message
          : 'Sesi belum dapat diperbarui. Coba lagi.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final failure = widget.error is ApiException
        ? widget.error as ApiException
        : ApiException.malformedResponse();
    return Semantics(
      liveRegion: true,
      child: Column(
        children: [
          const Center(
            child: KomplekkuLogo(
              variant: KomplekkuLogoVariant.lockup,
              width: 160,
            ),
          ),
          Expanded(
            child: AppErrorState(
              title: 'Sesi belum dapat diperiksa',
              message: failure.message,
              actionLabel: _isWorking ? 'Memeriksa…' : 'Coba lagi',
              // `_run` already no-ops re-entrant calls while `_isWorking` is
              // true — never pass `null` here, since `AppErrorState` treats a
              // null `onRetry` as "hide the action" rather than "disable it".
              onRetry: () => _run(widget.onRetry),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.base),
            child: AppButton(
              variant: AppButtonVariant.ghost,
              label: 'Hapus sesi dan masuk kembali',
              onPressed: _isWorking ? null : () => _run(widget.onSignOut),
            ),
          ),
        ],
      ),
    );
  }
}
