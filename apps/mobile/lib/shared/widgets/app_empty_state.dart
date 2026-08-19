import 'package:flutter/material.dart';
import 'package:komplekku/core/widgets/state_panel.dart';

/// "Nothing here yet" panel — a named, discoverable entry point for the
/// same `StatePanel` every screen already uses for its empty state (kept as
/// the single implementation since it also mirrors the web app's panel).
class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.inbox_outlined,
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
    return StatePanel(
      icon: icon,
      title: title,
      message: message,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }
}
