import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/shared/widgets/app_button.dart';

/// Shared empty/error placeholder for list and detail screens, mirroring the
/// web app's `StatePanel` so every feature handles these states the same way
/// instead of inventing a one-off layout per screen.
class StatePanel extends StatelessWidget {
  const StatePanel({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight:
                constraints.maxHeight > 48 ? constraints.maxHeight - 48 : 0.0,
          ),
          child: Center(
            child: Semantics(
              liveRegion: true,
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOut,
                builder: (context, value, child) => Opacity(
                  opacity: value,
                  child: Transform.translate(
                    offset: Offset(0, (1 - value) * 8),
                    child: child,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: AppColors.surfaceMuted,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, size: 26, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      title,
                      style: AppTypography.title,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      message,
                      style: AppTypography.body,
                      textAlign: TextAlign.center,
                    ),
                    if (actionLabel != null && onAction != null) ...[
                      const SizedBox(height: AppSpacing.lg),
                      AppButton(
                        label: actionLabel!,
                        onPressed: onAction,
                        expand: false,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
