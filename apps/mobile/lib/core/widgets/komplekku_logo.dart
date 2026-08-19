import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

enum KomplekkuLogoVariant { lockup, mark }

class KomplekkuLogo extends StatelessWidget {
  const KomplekkuLogo({
    super.key,
    this.variant = KomplekkuLogoVariant.mark,
    this.width = 44,
  });

  final KomplekkuLogoVariant variant;
  final double width;

  @override
  Widget build(BuildContext context) {
    final isLockup = variant == KomplekkuLogoVariant.lockup;
    final asset = isLockup
        ? 'assets/brand/komplekku-lockup.png'
        : 'assets/brand/komplekku-mark.png';

    return Semantics(
      image: true,
      label: 'Komplekku',
      child: ExcludeSemantics(
        child: Image.asset(
          asset,
          width: width,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.high,
          errorBuilder: (context, error, stackTrace) => SizedBox(
            width: width,
            height: width,
            child: _LogoFallback(compact: !isLockup),
          ),
        ),
      ),
    );
  }
}

class _LogoFallback extends StatelessWidget {
  const _LogoFallback({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: AppColors.primary),
      child: Center(
        child: Text(
          compact ? 'K' : 'Komplekku',
          style: TextStyle(
            color: AppColors.surface,
            fontSize: compact ? 20 : 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
