import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/shared/widgets/app_button.dart';

/// Confirm/cancel dialog with the app's modal radius and button styling —
/// used by [EntityActions]'s delete confirmation and create/edit dialogs that
/// don't need a full custom layout. Returns `true` only when the user taps
/// [confirmLabel]; dismissing (back button, tapping outside) resolves `null`,
/// same as a bare `showDialog<bool>`.
Future<bool?> showAppDialog({
  required BuildContext context,
  required String title,
  required String message,
  String confirmLabel = 'Lanjutkan',
  String cancelLabel = 'Batal',
  bool danger = false,
}) {
  return showDialog<bool>(
    context: context,
    builder: (context) => AppDialog(
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      danger: danger,
    ),
  );
}

class AppDialog extends StatelessWidget {
  const AppDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmLabel = 'Lanjutkan',
    this.cancelLabel = 'Batal',
    this.danger = false,
  });

  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.modal),
      ),
      title: Text(title, style: AppTypography.title),
      content: Text(message, style: AppTypography.body),
      actionsPadding: const EdgeInsets.fromLTRB(
        AppSpacing.base,
        0,
        AppSpacing.base,
        AppSpacing.base,
      ),
      actions: [
        AppButton(
          label: cancelLabel,
          variant: AppButtonVariant.ghost,
          expand: false,
          onPressed: () => Navigator.of(context).pop(false),
        ),
        AppButton(
          label: confirmLabel,
          variant: danger ? AppButtonVariant.danger : AppButtonVariant.primary,
          expand: false,
          onPressed: () => Navigator.of(context).pop(true),
        ),
      ],
    );
  }
}
