import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/notifications/fcm_service.dart';
import 'package:komplekku/core/notifications/push_notification_service.dart';
import 'package:komplekku/core/notifications/realtime_notification_service.dart';
import 'package:komplekku/features/notification/data/notification_repository.dart';
import 'package:komplekku/core/update/app_update_dialog.dart';
import 'package:komplekku/core/update/app_update_service.dart';
import 'package:komplekku/features/prayer/data/prayer_scheduler_service.dart';
import 'package:komplekku/shared/widgets/app_bottom_navigation.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell>
    with WidgetsBindingObserver {
  bool _updateChecked = false;
  bool _reschedulingPrayers = false;

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
    // App-start and app-resume can both fire in quick succession (e.g.
    // resuming right after launch); without this guard the two calls would
    // race to cancel/recreate the same native schedule.
    if (_reschedulingPrayers) return;
    _reschedulingPrayers = true;
    final scheduler = ref.read(prayerSchedulerServiceProvider);
    try {
      await scheduler.requestPermissions();
      await scheduler.rescheduleUpcomingPrayers();
      final autoAdzanEnabled = await scheduler.isAutoAdzanEnabled();
      if (!mounted) return;
      ref.read(prayerScheduleHealthProvider.notifier).update(
            PrayerScheduleHealth(
              exactAlarmAllowed: scheduler.exactAlarmAllowed,
              scheduledCount: scheduler.scheduledNotificationCount,
              lastError: scheduler.lastScheduleError,
            ),
          );
      if (scheduler.scheduledNotificationCount > 0 || !autoAdzanEnabled) {
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
      ref.read(prayerScheduleHealthProvider.notifier).update(
            PrayerScheduleHealth(
              exactAlarmAllowed: scheduler.exactAlarmAllowed,
              scheduledCount: scheduler.scheduledNotificationCount,
              lastError: scheduler.lastScheduleError ?? error.toString(),
            ),
          );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Adzan otomatis belum aktif. Periksa izin notifikasi lalu buka kembali aplikasi.',
          ),
        ),
      );
    } finally {
      _reschedulingPrayers = false;
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
      bottomNavigationBar: AppBottomNavigation(
        currentIndex: currentIndex,
        onTap: goBranch,
        destinations: [
          const AppNavDestination(
            icon: Icons.home_outlined,
            selectedIcon: Icons.home,
            label: 'Beranda',
          ),
          const AppNavDestination(
            icon: Icons.mosque_outlined,
            selectedIcon: Icons.mosque,
            label: 'Shalat',
          ),
          AppNavDestination(
            icon: Icons.campaign_outlined,
            selectedIcon: Icons.campaign,
            label: 'Pengumuman',
            badgeCount: unreadCount,
          ),
          const AppNavDestination(
            icon: Icons.forum_outlined,
            selectedIcon: Icons.forum,
            label: 'Forum',
          ),
          const AppNavDestination(
            icon: Icons.grid_view_outlined,
            selectedIcon: Icons.grid_view,
            label: 'Layanan',
          ),
        ],
      ),
    );
  }
}
