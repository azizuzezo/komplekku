import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';
import 'package:komplekku/features/onboarding/presentation/community_selection_screen.dart';
import 'package:komplekku/features/onboarding/presentation/onboarding_controller.dart';
import 'package:komplekku/features/onboarding/presentation/residency_request_screen.dart';
import 'package:komplekku/features/onboarding/presentation/widgets/onboarding_scaffold.dart';

class OnboardingFlowScreen extends ConsumerStatefulWidget {
  const OnboardingFlowScreen({super.key});

  @override
  ConsumerState<OnboardingFlowScreen> createState() =>
      _OnboardingFlowScreenState();
}

class _OnboardingFlowScreenState
    extends ConsumerState<OnboardingFlowScreen> {
  bool _isLoggingOut = false;

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

  Future<void> _submit({
    required String fullName,
    required String rtId,
    required String houseCode,
    required HouseholdRelationship relationship,
  }) async {
    final request = await ref.read(onboardingControllerProvider.notifier).submit(
          fullName: fullName,
          rtId: rtId,
          houseCode: houseCode,
          relationship: relationship,
        );
    if (!mounted) return;
    if (request == null) {
      ApiException? failure;
      ref.read(onboardingControllerProvider).whenData((value) {
        failure = value.submissionError;
      });
      if (failure?.isUnauthorized == true || failure?.isForbidden == true) {
        try {
          await ref.read(sessionControllerProvider.notifier).refresh();
        } catch (error) {
          if (mounted) _showFailure(error);
        }
      }
      return;
    }

    ref.read(sessionControllerProvider.notifier).markPendingApproval();
    context.go('/menunggu-verifikasi');
  }

  void _showFailure(Object error) {
    final message = error is ApiException
        ? error.message
        : 'Permintaan belum dapat diproses. Coba lagi.';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final onboarding = ref.watch(onboardingControllerProvider);
    return onboarding.when(
      loading: () => OnboardingScaffold(
        eyebrow: 'Menyiapkan pendaftaran',
        title: 'Menghubungkan lingkunganmu',
        description: 'Komplekku sedang memuat pilihan yang tersedia.',
        onLogout: _logout,
        isLoggingOut: _isLoggingOut,
        children: const [_OnboardingSkeleton()],
      ),
      error: (error, _) {
        final failure = error is ApiException
            ? error
            : ApiException.malformedResponse();
        return _OnboardingLoadError(
          failure: failure,
          onRetry: () => ref
              .read(onboardingControllerProvider.notifier)
              .retryLoad(),
          onLogout: _logout,
          isLoggingOut: _isLoggingOut,
        );
      },
      data: (data) {
        if (!data.isDetailsStep) {
          return CommunitySelectionScreen(
            communities: data.communities,
            selectedCommunity: data.selectedCommunity,
            onSelect: ref
                .read(onboardingControllerProvider.notifier)
                .selectCommunity,
            onContinue: ref
                .read(onboardingControllerProvider.notifier)
                .continueToDetails,
            onRetry: () => ref
                .read(onboardingControllerProvider.notifier)
                .retryLoad(),
            onLogout: _logout,
            isLoggingOut: _isLoggingOut,
          );
        }

        final community = data.selectedCommunity;
        if (community == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ref
                .read(onboardingControllerProvider.notifier)
                .backToCommunities();
          });
          return const SizedBox.shrink();
        }
        return ResidencyRequestScreen(
          community: community,
          isSubmitting: data.isSubmitting,
          submissionError: data.submissionError,
          onSubmit: _submit,
          onBack: ref
              .read(onboardingControllerProvider.notifier)
              .backToCommunities,
          onLogout: _logout,
          isLoggingOut: _isLoggingOut,
        );
      },
    );
  }
}

class _OnboardingSkeleton extends StatelessWidget {
  const _OnboardingSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat pilihan lingkungan',
      liveRegion: true,
      child: ExcludeSemantics(
        child: Column(
          children: [
            for (var index = 0; index < 3; index++) ...[
              Container(
                height: 62,
                decoration: const BoxDecoration(
                  color: KomplekkuColors.surfaceSoft,
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
              ),
              if (index < 2) const SizedBox(height: 10),
            ],
          ],
        ),
      ),
    );
  }
}

class _OnboardingLoadError extends StatelessWidget {
  const _OnboardingLoadError({
    required this.failure,
    required this.onRetry,
    required this.onLogout,
    required this.isLoggingOut,
  });

  final ApiException failure;
  final VoidCallback onRetry;
  final VoidCallback onLogout;
  final bool isLoggingOut;

  @override
  Widget build(BuildContext context) {
    final mustSignIn = failure.isUnauthorized;
    return OnboardingScaffold(
      eyebrow: mustSignIn ? 'Sesi berakhir' : 'Pendaftaran warga',
      title: mustSignIn
          ? 'Masuk kembali untuk melanjutkan'
          : failure.isForbidden
              ? 'Pendaftaran belum diizinkan'
              : 'Pilihan lingkungan belum termuat',
      description: failure.message,
      onLogout: onLogout,
      isLoggingOut: isLoggingOut,
      children: [
        Semantics(
          liveRegion: true,
          child: Icon(
            mustSignIn
                ? Icons.lock_outline
                : failure.isNetworkError
                    ? Icons.cloud_off_outlined
                    : Icons.info_outline,
            size: 34,
          ),
        ),
        const SizedBox(height: 20),
        if (!mustSignIn)
          FilledButton(onPressed: onRetry, child: const Text('Coba lagi'))
        else
          FilledButton(onPressed: onLogout, child: const Text('Masuk kembali')),
      ],
    );
  }
}
