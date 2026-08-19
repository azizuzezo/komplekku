import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// Page-level heading used in place of a plain `AppBar` on hub/index screens
/// (Layanan, Forum, Pengumuman, Akun, Shalat) — title + optional subtitle,
/// with the back/notification/search affordances a resident desk needs.
class AppHeader extends StatelessWidget {
  const AppHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.showBack = false,
    this.showNotifications = true,
    this.showSearch = true,
    this.showAccount = false,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final bool showBack;
  final bool showNotifications;
  final bool showSearch;
  final bool showAccount;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showBack) ...[
          _HeaderAction(
            tooltip: 'Kembali',
            icon: Icons.arrow_back,
            onPressed: () => context.pop(),
            transparent: true,
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.heading),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(
                  subtitle!,
                  style: AppTypography.label.copyWith(
                    color: AppColors.primaryDark,
                  ),
                ),
              ],
            ],
          ),
        ),
        ?trailing,
        if (showNotifications)
          _HeaderAction(
            tooltip: 'Notifikasi',
            icon: Icons.notifications_none_outlined,
            onPressed: () => context.push('/notifikasi'),
          ),
        if (showSearch) ...[
          const SizedBox(width: AppSpacing.sm),
          _HeaderAction(
            tooltip: 'Cari',
            icon: Icons.search,
            onPressed: () => context.push('/pengumuman'),
          ),
        ],
        if (showAccount) ...[
          const SizedBox(width: AppSpacing.sm),
          _HeaderAction(
            tooltip: 'Profil',
            icon: Icons.person_outline,
            onPressed: () => context.push('/akun'),
          ),
        ],
      ],
    );
  }
}

class _HeaderAction extends StatelessWidget {
  const _HeaderAction({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
    this.transparent = false,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;
  final bool transparent;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      icon: Icon(icon, size: 24),
      style: IconButton.styleFrom(
        minimumSize: const Size(48, 48),
        backgroundColor: transparent ? Colors.transparent : AppColors.surfaceSoft,
        foregroundColor: AppColors.textPrimary,
        shape: const CircleBorder(),
      ),
    );
  }
}
