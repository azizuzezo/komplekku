import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// Loading placeholder — `StatePanel` deliberately has no loading variant of
/// its own (empty/error only), so this fills that gap. Two shapes: a plain
/// centered spinner for short waits, or [AppLoadingState.skeleton] for list
/// screens that want a pulsing row-shaped placeholder instead of a blank
/// screen + spinner.
class AppLoadingState extends StatelessWidget {
  const AppLoadingState({super.key, this.message}) : _skeletonRows = null;

  const AppLoadingState.skeleton({super.key, int rows = 4})
    : message = null,
      _skeletonRows = rows;

  final String? message;
  final int? _skeletonRows;

  @override
  Widget build(BuildContext context) {
    if (_skeletonRows != null) {
      return _SkeletonPulse(rows: _skeletonRows);
    }
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(strokeWidth: 2.4),
          if (message != null) ...[
            const SizedBox(height: AppSpacing.md),
            Text(message!, style: AppTypography.body),
          ],
        ],
      ),
    );
  }
}

class _SkeletonPulse extends StatefulWidget {
  const _SkeletonPulse({required this.rows});

  final int rows;

  @override
  State<_SkeletonPulse> createState() => _SkeletonPulseState();
}

class _SkeletonPulseState extends State<_SkeletonPulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: FadeTransition(
        opacity: _controller.drive(Tween(begin: 0.5, end: 1)),
        child: ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.base),
          itemCount: widget.rows,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
          itemBuilder: (context, index) => Container(
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
            ),
          ),
        ),
      ),
    );
  }
}
