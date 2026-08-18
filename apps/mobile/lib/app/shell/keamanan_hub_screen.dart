import 'package:flutter/material.dart';
import 'package:komplekku/core/widgets/hub_menu_screen.dart';

class KeamananHubScreen extends StatelessWidget {
  const KeamananHubScreen({super.key});

  static const _entries = [
    HubMenuEntry(
      icon: Icons.videocam_outlined,
      label: 'CCTV',
      description: 'Pantau kamera lingkungan (mode simulasi).',
      route: '/keamanan/cctv',
      permission: 'camera.public.read',
    ),
    HubMenuEntry(
      icon: Icons.person_add_alt_outlined,
      label: 'Tamu',
      description: 'Daftarkan dan pantau tamu yang berkunjung.',
      route: '/keamanan/tamu',
      permission: 'visitor.create',
    ),
    HubMenuEntry(
      icon: Icons.inventory_2_outlined,
      label: 'Paket',
      description: 'Lihat status paket yang diterima keamanan.',
      route: '/keamanan/paket',
      permission: 'package.read',
    ),
    HubMenuEntry(
      icon: Icons.sos_outlined,
      label: 'Darurat',
      description: 'Kirim dan pantau permintaan darurat.',
      route: '/keamanan/darurat',
      permission: 'emergency.create',
    ),
    HubMenuEntry(
      icon: Icons.notifications_active_outlined,
      label: 'Darurat Masuk',
      description: 'Terima dan tangani sinyal darurat dari warga.',
      route: '/keamanan/darurat-masuk',
      permission: 'emergency.read',
    ),
    HubMenuEntry(
      icon: Icons.report_gmailerrorred_outlined,
      label: 'Kejadian',
      description: 'Laporkan dan tinjau kejadian keamanan.',
      route: '/keamanan/kejadian',
      permission: 'incident.create',
    ),
    HubMenuEntry(
      icon: Icons.route_outlined,
      label: 'Patroli',
      description: 'Jalankan checklist patroli keamanan.',
      route: '/keamanan/patroli',
      permission: 'patrol.execute',
    ),
    HubMenuEntry(
      icon: Icons.dashboard_outlined,
      label: 'Dashboard Keamanan',
      description: 'Ringkasan operasi keamanan lingkungan.',
      route: '/keamanan/dashboard',
      permission: 'security.dashboard.read',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return const HubMenuScreen(title: 'Keamanan', entries: _entries);
  }
}
