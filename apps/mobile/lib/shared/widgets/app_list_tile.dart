import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

/// Replaces the copy-pasted "`Card` wrapping a `ListTile`" row used across
/// list screens with one consistent icon-chip + title/subtitle + trailing
/// shape.
class AppListTile extends StatelessWidget {
  const AppListTile({
    super.key,
    required this.title,
    this.subtitle,
    this.leadingIcon,
    this.trailing,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final IconData? leadingIcon;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.base,
        vertical: AppSpacing.md,
      ),
      onTap: onTap,
      child: Row(
        children: [
          if (leadingIcon != null) ...[
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(AppRadius.small),
              ),
              child: Icon(leadingIcon, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: AppTypography.body),
                ],
              ],
            ),
          ),
          if (trailing != null)
            Padding(
              padding: const EdgeInsets.only(left: AppSpacing.sm),
              child: trailing,
            )
          else if (onTap != null)
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        ],
      ),
    );
  }
}
