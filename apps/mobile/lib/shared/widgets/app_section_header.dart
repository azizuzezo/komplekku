import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// In-screen section heading (not the page-level `AppHeader`) — replaces the
/// ad hoc `Text(..., style: titleLarge)` scattered through dashboard/detail
/// screens, with an optional trailing text action ("Lihat semua", etc.).
class AppSectionHeader extends StatelessWidget {
  const AppSectionHeader({super.key, required this.title, this.action, this.onAction});

  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Expanded(child: Text(title, style: AppTypography.title)),
          if (action != null && onAction != null)
            TextButton(onPressed: onAction, child: Text(action!)),
        ],
      ),
    );
  }
}
