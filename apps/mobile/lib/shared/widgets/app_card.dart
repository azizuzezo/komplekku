import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// Standardizes card padding and tap-ripple clipping so screens stop
/// hand-rolling `Card(child: Padding(...))` with a different inset each time.
/// Color/elevation/shape/border already come from `CardThemeData`.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.base),
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Padding(padding: padding, child: child);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: onTap == null ? content : InkWell(onTap: onTap, child: content),
    );
  }
}
