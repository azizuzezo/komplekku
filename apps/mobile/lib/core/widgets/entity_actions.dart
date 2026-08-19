import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/shared/widgets/app_dialog.dart';

/// The "⋮" menu carrying Edit and Hapus for anything a warga or pengurus owns
/// — announcements, agenda, forum posts.
///
/// One widget so the confirmation step is never accidentally skipped in one
/// place and present in another: deleting always asks first.
class EntityActions extends StatefulWidget {
  const EntityActions({
    super.key,
    required this.deleteTitle,
    required this.deleteMessage,
    this.onEdit,
    this.onDelete,
    this.isBusy = false,
    this.tooltip = 'Tindakan lainnya',
  });

  final String deleteTitle;
  final String deleteMessage;
  final VoidCallback? onEdit;
  final Future<void> Function()? onDelete;
  final bool isBusy;
  final String tooltip;

  @override
  State<EntityActions> createState() => _EntityActionsState();
}

class _EntityActionsState extends State<EntityActions> {
  bool _deleting = false;

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showAppDialog(
      context: context,
      title: widget.deleteTitle,
      message: widget.deleteMessage,
      confirmLabel: 'Hapus',
      danger: true,
    );
    if (confirmed != true || widget.onDelete == null) return;
    setState(() => _deleting = true);
    try {
      await widget.onDelete!.call();
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.onEdit == null && widget.onDelete == null) {
      return const SizedBox.shrink();
    }
    if (widget.isBusy || _deleting) {
      return const SizedBox(
        width: 40,
        height: 40,
        child: Center(
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    return PopupMenuButton<String>(
      tooltip: widget.tooltip,
      icon: const Icon(
        Icons.more_vert,
        size: 20,
        color: AppColors.textSecondary,
      ),
      onSelected: (action) {
        if (action == 'edit') widget.onEdit?.call();
        if (action == 'delete') _confirmDelete(context);
      },
      itemBuilder: (context) => [
        if (widget.onEdit != null)
          const PopupMenuItem(
            value: 'edit',
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(Icons.edit_outlined, size: 20),
              title: Text('Edit'),
            ),
          ),
        if (widget.onDelete != null)
          const PopupMenuItem(
            value: 'delete',
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(
                Icons.delete_outline,
                size: 20,
                color: AppColors.danger,
              ),
              title: Text(
                'Hapus',
                style: TextStyle(color: AppColors.danger),
              ),
            ),
          ),
      ],
    );
  }
}
