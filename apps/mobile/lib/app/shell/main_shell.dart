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

    return Scaffold(
      body: widget.navigationShell,
      // Forum Warga is deliberately called out as a raised, purple "bubble"
      // above the bottom nav rather than folded into the Aktivitas hub list
      // — an explicit owner request to make chat the most discoverable
      // action, overriding the app's usual civic-green/terracotta palette
      // for this one highlighted control.
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/aktivitas/forum'),
        backgroundColor: const Color(0xFF7C3AED),
        foregroundColor: Colors.white,
        tooltip: 'Forum Warga',
        child: const Icon(Icons.forum),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      bottomNavigationBar: NavigationBar(
        selectedIndex: widget.navigationShell.currentIndex,
        onDestinationSelected: (index) => widget.navigationShell.goBranch(
          index,
          initialLocation: index == widget.navigationShell.currentIndex,
        ),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Beranda',
          ),
          const NavigationDestination(
            icon: Icon(Icons.shield_outlined),
            selectedIcon: Icon(Icons.shield),
            label: 'Keamanan',
          ),
          const NavigationDestination(
            icon: Icon(Icons.miscellaneous_services_outlined),
            selectedIcon: Icon(Icons.miscellaneous_services),
            label: 'Layanan',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text('$unreadCount'),
              child: const Icon(Icons.notifications_none_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text('$unreadCount'),
              child: const Icon(Icons.notifications),
            ),
            label: 'Aktivitas',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Akun',
          ),
        ],
      ),
    );
  }
}

