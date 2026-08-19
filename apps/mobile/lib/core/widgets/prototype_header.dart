import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';

class PrototypeHeader extends StatelessWidget {
  const PrototypeHeader({
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
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(
                  subtitle!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: KomplekkuColors.primaryDark,
                    fontWeight: FontWeight.w700,
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
          const SizedBox(width: 8),
          _HeaderAction(
            tooltip: 'Cari',
            icon: Icons.search,
            onPressed: () => context.push('/pengumuman'),
          ),
        ],
        if (showAccount) ...[
          const SizedBox(width: 8),
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
      icon: Icon(icon, size: 26),
      style: IconButton.styleFrom(
        minimumSize: const Size(48, 48),
        backgroundColor: transparent
            ? Colors.transparent
            : KomplekkuColors.surfaceSoft,
        foregroundColor: KomplekkuColors.textPrimary,
        shape: const CircleBorder(),
      ),
    );
  }
}
