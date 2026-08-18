import 'package:flutter/material.dart';
import 'package:komplekku/app/theme/app_theme.dart';

/// The "⋮" menu carrying Edit and Hapus for anything a warga or pengurus owns
/// — announcements, agenda, forum posts.
///
/// One widget so the confirmation step is never accidentally skipped in one
/// place and present in another: deleting always asks first.
class EntityActions extends StatelessWidget {
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

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(deleteTitle),
        content: Text(deleteMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: KomplekkuColors.danger,
            ),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    if (confirmed == true) await onDelete?.call();
  }

  @override
  Widget build(BuildContext context) {
    if (onEdit == null && onDelete == null) return const SizedBox.shrink();
    if (isBusy) {
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
      tooltip: tooltip,
      icon: const Icon(
        Icons.more_vert,
        size: 20,
        color: KomplekkuColors.textSecondary,
      ),
      onSelected: (action) {
        if (action == 'edit') onEdit?.call();
        if (action == 'delete') _confirmDelete(context);
      },
      itemBuilder: (context) => [
        if (onEdit != null)
          const PopupMenuItem(
            value: 'edit',
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(Icons.edit_outlined, size: 20),
              title: Text('Edit'),
            ),
          ),
        if (onDelete != null)
          const PopupMenuItem(
            value: 'delete',
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(
                Icons.delete_outline,
                size: 20,
                color: KomplekkuColors.danger,
              ),
              title: Text(
                'Hapus',
                style: TextStyle(color: KomplekkuColors.danger),
              ),
            ),
          ),
      ],
    );
  }
}
