import 'package:flutter/material.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/presentation/widgets/onboarding_scaffold.dart';

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
          _EmptyCommunities(onRetry: onRetry)
        else ...[
          Material(
            color: KomplekkuColors.surface,
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              side: const BorderSide(color: KomplekkuColors.border),
              borderRadius: const BorderRadius.all(Radius.circular(10)),
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
                      activeColor: KomplekkuColors.primary,
                      title: Text(
                        communities[index].name,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 12),
                    ),
                    if (index < communities.length - 1)
                      const Divider(height: 1, indent: 16, endIndent: 16),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            key: const ValueKey('continue-community'),
            onPressed: selectedCommunity == null ? null : onContinue,
            child: const Text('Lanjutkan'),
          ),
        ],
      ],
    );
  }
}

class _EmptyCommunities extends StatelessWidget {
  const _EmptyCommunities({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: KomplekkuColors.surface,
          border: Border.all(color: KomplekkuColors.border),
          borderRadius: const BorderRadius.all(Radius.circular(10)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Icon(Icons.holiday_village_outlined, size: 30),
              const SizedBox(height: 12),
              Text(
                'Belum ada lingkungan yang membuka pendaftaran warga.',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Coba lagi setelah pengurus mengaktifkan pendaftaran.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 18),
              OutlinedButton(
                onPressed: onRetry,
                child: const Text('Muat ulang'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
