import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/presentation/widgets/onboarding_scaffold.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_empty_state.dart';

/// Step 1 of onboarding — a radio list of open communities, or the
/// `AppEmptyState` when the pengurus hasn't opened registration anywhere.
class CommunitySelectionScreen extends StatelessWidget {
  const CommunitySelectionScreen({
    super.key,
    required this.communities,
    required this.selectedCommunity,
    required this.onSelect,
    required this.onContinue,
    required this.onRetry,
    required this.onLogout,
    required this.isLoggingOut,
  });

  final List<CommunityOption> communities;
  final CommunityOption? selectedCommunity;
  final ValueChanged<CommunityOption> onSelect;
  final VoidCallback onContinue;
  final VoidCallback onRetry;
  final VoidCallback onLogout;
  final bool isLoggingOut;

  @override
  Widget build(BuildContext context) {
    return OnboardingScaffold(
      eyebrow: 'Langkah 1 dari 2',
      title: 'Pilih lingkunganmu',
      description:
          'Pilih komunitas yang mengelola rumahmu. Daftar ini berasal dari pengurus Komplekku.',
      onLogout: onLogout,
      isLoggingOut: isLoggingOut,
      children: [
        if (communities.isEmpty)
          // Bounded height: `AppEmptyState` sizes itself to the available
          // height via `LayoutBuilder`, which is unbounded inside this
          // scrollable `ListView` unless it's given an explicit box.
          SizedBox(
            height: 340,
            child: AppEmptyState(
              icon: Icons.holiday_village_outlined,
              title: 'Belum ada lingkungan yang membuka pendaftaran warga.',
              message: 'Coba lagi setelah pengurus mengaktifkan pendaftaran.',
              actionLabel: 'Muat ulang',
              onAction: onRetry,
            ),
          )
        else ...[
          Material(
            color: AppColors.surface,
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              side: const BorderSide(color: AppColors.border),
              borderRadius: const BorderRadius.all(
                Radius.circular(AppRadius.medium),
              ),
            ),
            child: RadioGroup<CommunityOption>(
              groupValue: selectedCommunity,
              onChanged: (value) {
                if (value != null) onSelect(value);
              },
              child: Column(
                children: [
                  for (var index = 0;
                      index < communities.length;
                      index++) ...[
                    RadioListTile<CommunityOption>(
                      key: ValueKey('community-${communities[index].id}'),
                      value: communities[index],
                      selected: communities[index] == selectedCommunity,
                      activeColor: AppColors.primary,
                      title: Text(
                        communities[index].name,
                        style: AppTypography.bodyLarge.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                      ),
                    ),
                    if (index < communities.length - 1)
                      const Divider(height: 1, indent: 16, endIndent: 16),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          AppButton(
            key: const ValueKey('continue-community'),
            label: 'Lanjutkan',
            onPressed: selectedCommunity == null ? null : onContinue,
          ),
        ],
      ],
    );
  }
}
