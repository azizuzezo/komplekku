import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

enum AppButtonVariant { primary, secondary, ghost, danger }

/// Themed button with the `/design.md` press micro-interaction (scale 0.98
/// over 90ms on press, 120ms release) and a built-in loading state, so a
/// screen doesn't have to hand-roll `isSubmitting ? spinner : label` each time.
///
/// Wraps the same `FilledButton`/`OutlinedButton`/`TextButton` the theme
/// already styles — `onPressed` is passed straight through unchanged.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.icon,
    this.isLoading = false,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final bool expand;

  bool get _enabled => onPressed != null && !isLoading;

  @override
  Widget build(BuildContext context) {
    final onPressedResolved = _enabled ? onPressed : null;
    final child = _Content(label: label, icon: icon, isLoading: isLoading, variant: variant);

    final Widget button = switch (variant) {
      AppButtonVariant.primary => FilledButton(onPressed: onPressedResolved, child: child),
      AppButtonVariant.danger => FilledButton(
        onPressed: onPressedResolved,
        style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
        child: child,
      ),
      AppButtonVariant.secondary => OutlinedButton(onPressed: onPressedResolved, child: child),
      AppButtonVariant.ghost => TextButton(onPressed: onPressedResolved, child: child),
    };

    final sized = expand ? SizedBox(width: double.infinity, child: button) : button;
    return _PressScale(enabled: _enabled, child: sized);
  }
}

class _Content extends StatelessWidget {
  const _Content({
    required this.label,
    required this.icon,
    required this.isLoading,
    required this.variant,
  });

  final String label;
  final IconData? icon;
  final bool isLoading;
  final AppButtonVariant variant;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      final spinnerColor = variant == AppButtonVariant.primary || variant == AppButtonVariant.danger
          ? AppColors.surface
          : AppColors.primary;
      return SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2.4, color: spinnerColor),
      );
    }
    if (icon == null) return Text(label);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18),
        const SizedBox(width: AppSpacing.sm),
        Text(label),
      ],
    );
  }
}

/// Isolated as `Listener` (not `GestureDetector`) so it only observes pointer
/// down/up/cancel and never competes with the wrapped button's own tap
/// recognizer — the button keeps full ownership of `onPressed`/ripple/focus.
class _PressScale extends StatefulWidget {
  const _PressScale({required this.enabled, required this.child});

  final bool enabled;
  final Widget child;

  @override
  State<_PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<_PressScale> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;
    return Listener(
      onPointerDown: (_) => _setPressed(true),
      onPointerUp: (_) => _setPressed(false),
      onPointerCancel: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1.0,
        duration: Duration(milliseconds: _pressed ? 90 : 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
