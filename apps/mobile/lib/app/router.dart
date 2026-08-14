import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/not_found_screen.dart';
import 'package:komplekku/app/shell/aktivitas_hub_screen.dart';
import 'package:komplekku/app/shell/keamanan_hub_screen.dart';
import 'package:komplekku/app/shell/layanan_hub_screen.dart';
import 'package:komplekku/app/shell/main_shell.dart';
import 'package:komplekku/features/account/presentation/account_screen.dart';
import 'package:komplekku/features/admin_residency/presentation/residency_request_queue_screen.dart';
import 'package:komplekku/features/agenda/presentation/agenda_detail_screen.dart';
import 'package:komplekku/features/agenda/presentation/agenda_list_screen.dart';
import 'package:komplekku/features/announcement/presentation/announcement_detail_screen.dart';
import 'package:komplekku/features/announcement/presentation/announcement_list_screen.dart';
import 'package:komplekku/features/auth/domain/session_snapshot.dart';
import 'package:komplekku/features/auth/presentation/login_screen.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/auth/presentation/session_gate_screen.dart';
import 'package:komplekku/features/camera/presentation/camera_list_screen.dart';
import 'package:komplekku/features/cash/presentation/kas_screen.dart';
import 'package:komplekku/features/emergency/presentation/emergency_screen.dart';
import 'package:komplekku/features/facility/presentation/facility_screen.dart';
import 'package:komplekku/features/finance_dashboard/presentation/finance_dashboard_screen.dart';
import 'package:komplekku/features/home/presentation/home_screen.dart';
import 'package:komplekku/features/incident/presentation/incident_detail_screen.dart';
import 'package:komplekku/features/incident/presentation/incident_list_screen.dart';
import 'package:komplekku/features/invoice/presentation/invoice_detail_screen.dart';
import 'package:komplekku/features/invoice/presentation/iuran_screen.dart';
import 'package:komplekku/features/letter/presentation/letter_screen.dart';
import 'package:komplekku/features/notification/presentation/notification_list_screen.dart';
import 'package:komplekku/features/onboarding/presentation/account_status_screen.dart';
import 'package:komplekku/features/onboarding/presentation/onboarding_flow_screen.dart';
import 'package:komplekku/features/onboarding/presentation/pending_verification_screen.dart';
import 'package:komplekku/features/package/presentation/package_screen.dart';
import 'package:komplekku/features/patrol/presentation/patrol_screen.dart';
import 'package:komplekku/features/report/presentation/report_detail_screen.dart';
import 'package:komplekku/features/report/presentation/report_list_screen.dart';
import 'package:komplekku/features/security_dashboard/presentation/security_dashboard_screen.dart';
import 'package:komplekku/features/visitor/presentation/visitor_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _RouterRefreshNotifier();
  ref.listen(
    sessionControllerProvider,
    (previous, next) => refreshNotifier.refresh(),
  );

  final router = GoRouter(
    initialLocation: '/sesi',
    errorBuilder: (context, state) => const NotFoundScreen(),
    refreshListenable: refreshNotifier,
    redirect: (context, state) => redirectForSession(
      ref.read(sessionControllerProvider),
      state.matchedLocation,
    ),
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SessionGateScreen(),
      ),
      GoRoute(
        path: '/sesi',
        builder: (context, state) => const SessionGateScreen(),
      ),
      GoRoute(
        path: '/masuk',
        builder: (context, state) => const LoginScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/beranda',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/keamanan',
                builder: (context, state) => const KeamananHubScreen(),
                routes: [
                  GoRoute(
                    path: 'cctv',
                    builder: (context, state) => const CameraListScreen(),
                  ),
                  GoRoute(
                    path: 'tamu',
                    builder: (context, state) => const VisitorScreen(),
                  ),
                  GoRoute(
                    path: 'paket',
                    builder: (context, state) => const PackageScreen(),
                  ),
                  GoRoute(
                    path: 'darurat',
                    builder: (context, state) => const EmergencyScreen(),
                  ),
                  GoRoute(
                    path: 'kejadian',
                    builder: (context, state) => const IncidentListScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => IncidentDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'patroli',
                    builder: (context, state) => const PatrolScreen(),
                  ),
                  GoRoute(
                    path: 'dashboard',
                    builder: (context, state) => const SecurityDashboardScreen(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/layanan',
                builder: (context, state) => const LayananHubScreen(),
                routes: [
                  GoRoute(
                    path: 'laporan',
                    builder: (context, state) => const ReportListScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => ReportDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'surat',
                    builder: (context, state) => const LetterScreen(),
                  ),
                  GoRoute(
                    path: 'fasilitas',
                    builder: (context, state) => const FacilityScreen(),
                  ),
                  GoRoute(
                    path: 'iuran',
                    builder: (context, state) => const IuranScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => InvoiceDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'kas',
                    builder: (context, state) => const TransparansiKasScreen(),
                  ),
                  GoRoute(
                    path: 'keuangan',
                    builder: (context, state) => const FinanceDashboardScreen(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/aktivitas',
                builder: (context, state) => const AktivitasHubScreen(),
                routes: [
                  GoRoute(
                    path: 'pengumuman',
                    builder: (context, state) => const AnnouncementListScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => AnnouncementDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'agenda',
                    builder: (context, state) => const AgendaListScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => AgendaDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'notifikasi',
                    builder: (context, state) => const NotificationListScreen(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/akun',
                builder: (context, state) => const AccountScreen(),
                routes: [
                  GoRoute(
                    path: 'permohonan-warga',
                    builder: (context, state) =>
                        const ResidencyRequestQueueScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/mulai/komunitas',
        builder: (context, state) => const OnboardingFlowScreen(),
      ),
      GoRoute(
        path: '/menunggu-verifikasi',
        builder: (context, state) => const PendingVerificationScreen(),
      ),
      GoRoute(
        path: '/status-akun',
        builder: (context, state) => const AccountStatusScreen(),
      ),
    ],
  );

  ref.onDispose(() {
    router.dispose();
    refreshNotifier.dispose();
  });
  return router;
});

String? redirectForSession(
  AsyncValue<SessionSnapshot?> sessionState,
  String location,
) {
  return sessionState.when(
    loading: () => location == '/sesi' ? null : '/sesi',
    error: (error, stackTrace) => location == '/sesi' ? null : '/sesi',
    data: (session) {
      if (session == null) return location == '/masuk' ? null : '/masuk';
      return session.authState.allowsPath(location)
          ? null
          : session.authState.route;
    },
  );
}

class _RouterRefreshNotifier extends ChangeNotifier {
  void refresh() => notifyListeners();
}
