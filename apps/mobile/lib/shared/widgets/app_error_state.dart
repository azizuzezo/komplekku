import 'package:flutter/material.dart';
import 'package:komplekku/core/widgets/state_panel.dart';

/// "Something went wrong" panel with a retry action — same `StatePanel`
/// implementation as [AppEmptyState], just defaulted for the error case so
/// call sites don't have to pick an icon/tone themselves.
class AppErrorState extends StatelessWidget {
  const AppErrorState({
    super.key,
    this.title = 'Terjadi kesalahan',
    required this.message,
    this.icon = Icons.error_outline,
    this.actionLabel = 'Coba lagi',
    this.onRetry,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return StatePanel(
      icon: icon,
      title: title,
      message: message,
      actionLabel: onRetry == null ? null : actionLabel,
      onAction: onRetry,
    );
  }
}
