import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/notifications/fcm_service.dart';
import 'package:komplekku/core/notifications/push_notification_service.dart';
import 'package:komplekku/core/notifications/realtime_notification_service.dart';
import 'package:komplekku/features/notification/data/notification_repository.dart';
import 'package:komplekku/core/update/app_update_dialog.dart';
import 'package:komplekku/core/update/app_update_service.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell>
    with WidgetsBindingObserver {
  bool _updateChecked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(realtimeNotificationServiceProvider).startSync();
      ref
          .read(fcmServiceProvider)
          .initialize(
            onToken: (token) => ref
                .read(pushNotificationServiceProvider)
                .registerDeviceToken(token),
          );
      _reschedulePrayers();
      _checkForUpdate();
    });
  }

  /// Offers a newer APK once per app launch. Checked here rather than at
  /// startup so the dialog lands on a screen the user can already see, and
  /// silently does nothing when the server has no release configured.
  Future<void> _checkForUpdate() async {
    if (_updateChecked) return;
    _updateChecked = true;
    final release = await ref.read(appUpdateServiceProvider).checkForUpdate();
    if (release == null || !mounted) return;
    await showDialog<void>(
      context: context,
      barrierDismissible: !release.mandatory,
      builder: (context) => AppUpdateDialog(release: release),
    );
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
    try {
      await scheduler.requestPermissions();
      await scheduler.rescheduleUpcomingPrayers();
      final autoAdzanEnabled = await scheduler.isAutoAdzanEnabled();
      if (!mounted ||
          scheduler.scheduledNotificationCount > 0 ||
          !autoAdzanEnabled) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            scheduler.lastScheduleError == null
                ? 'Adzan otomatis belum dapat dijadwalkan. Periksa izin notifikasi.'
                : 'Adzan otomatis gagal dijadwalkan. Periksa izin notifikasi dan alarm.',
          ),
        ),
      );
    } catch (error) {
      debugPrint('Prayer scheduler initialization failed: $error');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Adzan otomatis belum aktif. Periksa izin notifikasi lalu buka kembali aplikasi.',
          ),
        ),
      );
    }
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
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: const Border(top: BorderSide(color: KomplekkuColors.border)),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 18,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 72,
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
                    icon: Icons.mosque_outlined,
                    selectedIcon: Icons.mosque,
                    label: 'Shalat',
                    selected: currentIndex == 1,
                    onTap: () => goBranch(1),
                  ),
                ),
                Expanded(
                  child: _NavTab(
                    icon: Icons.campaign_outlined,
                    selectedIcon: Icons.campaign,
                    label: 'Pengumuman',
                    selected: currentIndex == 2,
                    badgeCount: unreadCount,
                    onTap: () => goBranch(2),
                  ),
                ),
                Expanded(
                  child: _NavTab(
                    icon: Icons.forum_outlined,
                    selectedIcon: Icons.forum,
                    label: 'Forum',
                    selected: currentIndex == 3,
                    onTap: () => goBranch(3),
                  ),
                ),
                Expanded(
                  child: _NavTab(
                    icon: Icons.person_outline,
                    selectedIcon: Icons.person,
                    label: 'Profil',
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
    final color = selected
        ? KomplekkuColors.primary
        : KomplekkuColors.textSecondary;
    Widget iconWidget = Icon(
      selected ? selectedIcon : icon,
      color: color,
      size: 24,
    );
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
              SizedBox(
                width: 64,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    label,
                    maxLines: 1,
                    style: TextStyle(
                      color: color,
                      fontSize: 11,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
