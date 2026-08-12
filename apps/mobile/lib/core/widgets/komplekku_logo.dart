import 'package:flutter/material.dart';
import 'package:komplekku/app/theme/app_theme.dart';

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
    final logo = Image.asset(
      isLockup
          ? 'assets/brand/komplekku-lockup.png'
          : 'assets/brand/komplekku-mark.png',
      fit: isLockup ? BoxFit.cover : BoxFit.contain,
      alignment: Alignment.center,
      filterQuality: FilterQuality.high,
      errorBuilder: (context, error, stackTrace) => _LogoFallback(
        compact: !isLockup,
      ),
    );

    return Semantics(
      image: true,
      label: 'Komplekku',
      child: ExcludeSemantics(
        child: SizedBox(
          width: width,
          child: isLockup
              ? AspectRatio(
                  // Crop the untouched 4:3 source to its horizontal artwork.
                  aspectRatio: 3.38,
                  child: ClipRect(child: logo),
                )
              : AspectRatio(
                  aspectRatio: 1,
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final side = constraints.maxWidth;
                      return ClipRect(
                        child: Transform.translate(
                          offset: Offset(-side * 0.045, side * 0.075),
                          child: Transform.scale(
                            scale: 1.68,
                            child: logo,
                          ),
                        ),
                      );
                    },
                  ),
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
      decoration: const BoxDecoration(color: KomplekkuColors.primary),
      child: Center(
        child: Text(
          compact ? 'K' : 'Komplekku',
          style: TextStyle(
            color: KomplekkuColors.surface,
            fontSize: compact ? 20 : 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
