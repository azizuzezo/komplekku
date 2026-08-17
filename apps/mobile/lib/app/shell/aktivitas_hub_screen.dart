import 'package:flutter/material.dart';
import 'package:komplekku/core/widgets/hub_menu_screen.dart';

class AktivitasHubScreen extends StatelessWidget {
  const AktivitasHubScreen({super.key});

  static const _entries = [
    HubMenuEntry(
      icon: Icons.campaign_outlined,
      label: 'Pengumuman',
      description: 'Kabar dan papan lingkungan terbaru.',
      route: '/aktivitas/pengumuman',
    ),
    HubMenuEntry(
      icon: Icons.event_outlined,
      label: 'Agenda',
      description: 'Kegiatan lingkungan yang akan dan sudah berlangsung.',
      route: '/aktivitas/agenda',
    ),
    HubMenuEntry(
      icon: Icons.forum_outlined,
      label: 'Forum Warga',
      description: 'Obrolan realtime dengan warga RT-mu dan seluruh komunitas.',
      route: '/aktivitas/forum',
      permission: 'forum.read',
    ),
    HubMenuEntry(
      icon: Icons.notifications_none_outlined,
      label: 'Notifikasi',
      description: 'Pemberitahuan aktivitas akunmu.',
      route: '/aktivitas/notifikasi',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return const HubMenuScreen(title: 'Aktivitas', entries: _entries);
  }
}
