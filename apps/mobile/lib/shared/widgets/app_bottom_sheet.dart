import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// Consistent chrome (drag handle, top radius, safe-area + keyboard padding)
/// for the create/edit forms several screens already present as a modal
/// sheet. Wraps `showModalBottomSheet` — the caller's `builder` still owns
/// its own content/state/submission exactly as before.
Future<T?> showAppBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool isScrollControlled = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.modal)),
    ),
    builder: (context) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: AppSpacing.sm),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.borderStrong,
                borderRadius: BorderRadius.circular(AppRadius.pill),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Flexible(child: builder(context)),
          ],
        ),
      ),
    ),
  );
}
