import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/widgets/hub_menu_screen.dart';
import 'package:komplekku/core/widgets/prototype_header.dart';

class _LayananSection {
  const _LayananSection({required this.title, required this.entries});

  final String title;
  final List<HubMenuEntry> entries;
}

/// Warga: the resident-facing services that used to be the whole Layanan
/// menu before it absorbed Keamanan and the Pengurus tools.
const _wargaEntries = [
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
];

/// Keamanan keeps its own hub screen and paths (`/keamanan/*`) — this is a
/// single doorway into it rather than a duplicate flat list.
const _keamananEntries = [
  HubMenuEntry(
    icon: Icons.shield_outlined,
    label: 'Keamanan',
    description: 'CCTV, tamu, paket, darurat, kejadian, dan patroli.',
    route: '/keamanan',
  ),
];

const _keuanganEntries = [
  HubMenuEntry(
    icon: Icons.bar_chart_outlined,
    label: 'Keuangan',
    description: 'Ringkasan keuangan lingkungan.',
    route: '/layanan/keuangan',
    permission: 'finance.dashboard.read',
  ),
];

/// Pengurus: permission-gated admin tools. The whole section disappears for
/// a resident who holds none of these permissions.
const _pengurusEntries = [
  HubMenuEntry(
    icon: Icons.fact_check_outlined,
    label: 'Permohonan Warga',
    description: 'Tinjau permohonan tempat tinggal.',
    route: '/layanan/permohonan-warga',
    permission: 'resident.manage',
  ),
  HubMenuEntry(
    icon: Icons.location_city_outlined,
    label: 'Kelola Komunitas',
    description: 'Ubah identitas komunitas dan struktur RT.',
    route: '/layanan/komunitas',
    permission: 'community.manage',
  ),
  HubMenuEntry(
    icon: Icons.house_outlined,
    label: 'Kelola Rumah',
    description: 'Tambah rumah dan atur RT-nya.',
    route: '/layanan/rumah',
    permission: 'resident.manage',
  ),
  HubMenuEntry(
    icon: Icons.manage_accounts_outlined,
    label: 'Kelola Pengguna',
    description: 'Atur peran warga dan pengurus.',
    route: '/layanan/pengguna',
    permission: 'resident.manage',
  ),
];

const _sections = [
  _LayananSection(title: 'Warga', entries: _wargaEntries),
  _LayananSection(title: 'Keamanan', entries: _keamananEntries),
  _LayananSection(title: 'Keuangan', entries: _keuanganEntries),
  _LayananSection(title: 'Pengurus', entries: _pengurusEntries),
];

/// The fifth bottom tab: every operational menu that does not fit the other
/// four slots, grouped so Keamanan and the permission-gated Pengurus tools
/// read as distinct from the everyday Warga services.
class LayananHubScreen extends ConsumerWidget {
  const LayananHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(currentPermissionsProvider);
    final visibleSections = _sections
        .map(
          (section) => _LayananSection(
            title: section.title,
            entries: section.entries
                .where((entry) => hasPermission(permissions, entry.permission))
                .toList(growable: false),
          ),
        )
        .where((section) => section.entries.isNotEmpty)
        .toList(growable: false);

    return Scaffold(
      backgroundColor: KomplekkuColors.background,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            const PrototypeHeader(
              title: 'Layanan',
              subtitle: 'RT 05 / RW 03 • Billabong',
              showAccount: true,
            ),
            const SizedBox(height: 20),
            for (final section in visibleSections) ...[
              Text(
                section.title,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),
              _SectionCard(entries: section.entries),
              const SizedBox(height: 20),
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.entries});

  final List<HubMenuEntry> entries;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: KomplekkuColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: KomplekkuColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (final entry in entries) ...[
            ListTile(
              leading: Icon(entry.icon, color: KomplekkuColors.primary),
              title: Text(
                entry.label,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: Text(entry.description),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push(entry.route),
            ),
            if (entry != entries.last)
              const Divider(height: 1, color: KomplekkuColors.border),
          ],
        ],
      ),
    );
  }
}
