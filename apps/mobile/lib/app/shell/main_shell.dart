import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/notifications/fcm_service.dart';
import 'package:komplekku/core/notifications/push_notification_service.dart';
import 'package:komplekku/core/notifications/realtime_notification_service.dart';
import 'package:komplekku/features/notification/data/notification_repository.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(realtimeNotificationServiceProvider).startSync();
      ref.read(fcmServiceProvider).initialize(
            onToken: (token) =>
                ref.read(pushNotificationServiceProvider).registerDeviceToken(token),
          );
      _reschedulePrayers();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _reschedulePrayers();
    }
  }

  Future<void> _reschedulePrayers() async {
    final scheduler = ref.read(prayerSchedulerServiceProvider);
    await scheduler.requestPermissions();
    await scheduler.rescheduleUpcomingPrayers();
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = ref.watch(unreadNotificationCountProvider).value ?? 0;
    final currentIndex = widget.navigationShell.currentIndex;

    void goBranch(int index) => widget.navigationShell.goBranch(
          index,
          initialLocation: index == currentIndex,
        );

    return Scaffold(
      body: widget.navigationShell,
      // Forum Warga is a raised, purple "bubble" that gets its own slot in
      // the bottom bar — matching the web bottom nav's
      // `.mobile-navigation__item--bubble` (a genuine 6th grid column raised
      // via negative top offset). Earlier this was layered as an overlay
      // (FAB, then a Stack) centered on top of the existing 5-tab bar, which
      // put it directly on top of "Layanan" (the bar's middle tab) instead of
      // beside it — confirmed by an on-device screenshot showing the overlap.
      // A custom Row with Forum as its own Expanded slot avoids that: every
      // tab, including Forum, gets independent horizontal space.
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: const Border(top: BorderSide(color: Color(0xFFDBDADE))),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 74,
            child: Row(
              children: [
                Expanded(
                  child: _NavTab(
                    icon: Icons.home_outlined,
                    selectedIcon: Icons.home,
                    label: 'Beranda',
                    selected: currentIndex == 0,
                    onTap: () => goBranch(0),
                  ),
                ),
                Expanded(
                  child: _NavTab(
                    icon: Icons.shield_outlined,
                    selectedIcon: Icons.shield,
                    label: 'Keamanan',
                    selected: currentIndex == 1,
                    onTap: () => goBranch(1),
                  ),
                ),
                Expanded(
                  child: _NavTab(
                    icon: Icons.miscellaneous_services_outlined,
                    selectedIcon: Icons.miscellaneous_services,
                    label: 'Layanan',
                    selected: currentIndex == 2,
                    onTap: () => goBranch(2),
                  ),
                ),
                const Expanded(child: _ForumBubbleTab()),
                Expanded(
                  child: _NavTab(
                    icon: Icons.notifications_none_outlined,
                    selectedIcon: Icons.notifications,
                    label: 'Aktivitas',
                    selected: currentIndex == 3,
                    badgeCount: unreadCount,
                    onTap: () => goBranch(3),
                  ),
                ),
                Expanded(
                  child: _NavTab(
                    icon: Icons.person_outline,
                    selectedIcon: Icons.person,
                    label: 'Akun',
                    selected: currentIndex == 4,
                    onTap: () => goBranch(4),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  const _NavTab({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.onTap,
    this.badgeCount = 0,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final int badgeCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? const Color(0xFF4B2DA1) : const Color(0xFF777480);
    Widget iconWidget = Icon(selected ? selectedIcon : icon, color: color, size: 24);
    if (badgeCount > 0) {
      iconWidget = Badge(label: Text('$badgeCount'), child: iconWidget);
    }

    return InkWell(
      onTap: onTap,
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              iconWidget,
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ForumBubbleTab extends StatelessWidget {
  const _ForumBubbleTab();

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/aktivitas/forum'),
      child: Align(
        alignment: Alignment.topCenter,
        child: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF7C3AED),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.22),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: const Icon(Icons.forum, color: Colors.white, size: 22),
              ),
              const SizedBox(height: 2),
              const Text(
                'Forum',
                style: TextStyle(
                  color: Color(0xFF7C3AED),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

