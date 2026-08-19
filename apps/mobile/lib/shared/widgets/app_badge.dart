import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// Semantic status tone — never a raw color — so a badge always maps to one
/// of `/design.md`'s reserved meanings instead of decoration.
enum AppBadgeTone { neutral, brand, success, warning, danger }

/// Consolidates the small `Container` + alpha-tinted-background status pill
/// that had been hand-copied per feature (incident/invoice/letter/report/
/// package/camera/emergency/payment each had their own near-identical copy).
class AppBadge extends StatelessWidget {
  const AppBadge({
    super.key,
    required this.label,
    this.tone = AppBadgeTone.neutral,
    this.icon,
  });

  final String label;
  final AppBadgeTone tone;
  final IconData? icon;

  Color get _color => switch (tone) {
    AppBadgeTone.neutral => AppColors.textSecondary,
    AppBadgeTone.brand => AppColors.primary,
    AppBadgeTone.success => AppColors.success,
    AppBadgeTone.warning => AppColors.warning,
    AppBadgeTone.danger => AppColors.danger,
  };

  @override
  Widget build(BuildContext context) {
    final color = _color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: AppTypography.caption.copyWith(color: color, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
