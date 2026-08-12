import 'package:flutter/material.dart';
import 'package:komplekku/core/widgets/hub_menu_screen.dart';

class LayananHubScreen extends StatelessWidget {
  const LayananHubScreen({super.key});

  static const _entries = [
    HubMenuEntry(
      icon: Icons.report_problem_outlined,
      label: 'Lapor Masalah',
      description: 'Laporkan masalah lingkungan dan pantau tindak lanjutnya.',
      route: '/layanan/laporan',
      permission: 'report.create',
    ),
    HubMenuEntry(
      icon: Icons.description_outlined,
      label: 'Surat',
      description: 'Ajukan surat dan lihat status permohonan.',
      route: '/layanan/surat',
      permission: 'letter.create',
    ),
    HubMenuEntry(
      icon: Icons.apartment_outlined,
      label: 'Fasilitas',
      description: 'Pesan fasilitas bersama lingkungan.',
      route: '/layanan/fasilitas',
      permission: 'facility.read',
    ),
    HubMenuEntry(
      icon: Icons.receipt_long_outlined,
      label: 'Iuran',
      description: 'Lihat dan bayar tagihan iuran.',
      route: '/layanan/iuran',
      permission: 'invoice.read',
    ),
    HubMenuEntry(
      icon: Icons.account_balance_outlined,
      label: 'Transparansi Kas',
      description: 'Buku kas lingkungan yang terbuka untuk warga.',
      route: '/layanan/kas',
      permission: 'cash.read',
    ),
    HubMenuEntry(
      icon: Icons.bar_chart_outlined,
      label: 'Keuangan',
      description: 'Ringkasan keuangan lingkungan.',
      route: '/layanan/keuangan',
      permission: 'finance.dashboard.read',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return const HubMenuScreen(title: 'Layanan', entries: _entries);
  }
}
