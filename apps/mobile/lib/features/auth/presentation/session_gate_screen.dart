import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/komplekku_logo.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class SessionGateScreen extends ConsumerWidget {
  const SessionGateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    return Scaffold(
      backgroundColor: KomplekkuColors.brandCanvas,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
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
        ),
      ),
    );
  }
}

class _SessionLoading extends StatelessWidget {
  const _SessionLoading();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memeriksa sesi Komplekku',
      liveRegion: true,
      child: const ExcludeSemantics(
        child: KomplekkuLogo(width: 54),
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
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: KomplekkuLogo(width: 48),
          ),
          const SizedBox(height: 28),
          Text(
            'Sesi belum dapat diperiksa',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 10),
          Text(failure.message, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _isWorking ? null : () => _run(widget.onRetry),
            child: Text(_isWorking ? 'Memeriksa…' : 'Coba lagi'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _isWorking ? null : () => _run(widget.onSignOut),
            child: const Text('Hapus sesi dan masuk kembali'),
          ),
        ],
      ),
    );
  }
}
