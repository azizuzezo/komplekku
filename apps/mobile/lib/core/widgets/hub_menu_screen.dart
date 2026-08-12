import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/widgets/state_panel.dart';

/// One tappable row in a [HubMenuScreen]. [permission] mirrors the web
/// sidebar's per-item `permission` field (`desktop-sidebar.tsx`) — when set,
/// the entry is hidden unless the account holds that permission string.
class HubMenuEntry {
  const HubMenuEntry({
    required this.icon,
    required this.label,
    required this.description,
    required this.route,
    this.permission,
  });

  final IconData icon;
  final String label;
  final String description;
  final String route;
  final String? permission;
}

/// Shared grouped-menu screen used by the Keamanan/Layanan/Aktivitas bottom
/// nav tabs, since a phone's bottom nav cannot fit every Phase 2-4 feature
/// as its own destination the way the web sidebar does.
class HubMenuScreen extends ConsumerWidget {
  const HubMenuScreen({super.key, required this.title, required this.entries});

  final String title;
  final List<HubMenuEntry> entries;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(currentPermissionsProvider);
    final visible = entries
        .where((entry) => hasPermission(permissions, entry.permission))
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: visible.isEmpty
            ? const StatePanel(
                icon: Icons.lock_outline,
                title: 'Belum ada menu tersedia',
                message: 'Akunmu belum memiliki akses ke menu ini.',
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                itemCount: visible.length,
                separatorBuilder: (context, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final entry = visible[index];
                  return Card(
                    clipBehavior: Clip.antiAlias,
                    child: ListTile(
                      leading: Icon(entry.icon, color: KomplekkuColors.primary),
                      title: Text(
                        entry.label,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      subtitle: Text(entry.description),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push(entry.route),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
