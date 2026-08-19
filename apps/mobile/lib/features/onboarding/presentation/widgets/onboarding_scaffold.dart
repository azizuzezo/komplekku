import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/widgets/komplekku_logo.dart';
import 'package:komplekku/shared/widgets/app_button.dart';

/// Shared chrome for every onboarding step — logo lockup + logout action in
/// the app bar, then eyebrow/title/description header above the step body.
class OnboardingScaffold extends StatelessWidget {
  const OnboardingScaffold({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.children,
    required this.onLogout,
    this.isLoggingOut = false,
  });

  final String eyebrow;
  final String title;
  final String description;
  final List<Widget> children;
  final VoidCallback onLogout;
  final bool isLoggingOut;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brandCanvas,
      appBar: AppBar(
        toolbarHeight: 68,
        titleSpacing: AppSpacing.lg,
        // Split Studio: identity-first surfaces use the complete lockup, not
        // the compact mark — see `/design.md` "Brand assets".
        title: const KomplekkuLogo(
          variant: KomplekkuLogoVariant.lockup,
          width: 128,
        ),
        actions: [
          AppButton(
            variant: AppButtonVariant.ghost,
            icon: Icons.logout,
            label: isLoggingOut ? 'Keluar…' : 'Keluar',
            onPressed: isLoggingOut ? null : onLogout,
            expand: false,
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.xxxl,
              ),
              children: [
                Text(
                  eyebrow.toUpperCase(),
                  style: AppTypography.label.copyWith(
                    color: AppColors.primary,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(title, style: AppTypography.heading),
                const SizedBox(height: AppSpacing.sm),
                Text(description, style: AppTypography.body),
                const SizedBox(height: AppSpacing.xl),
                ...children,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
