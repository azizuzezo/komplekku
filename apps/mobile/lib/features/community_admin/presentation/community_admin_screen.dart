import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';

class CommunityAdminScreen extends ConsumerWidget {
  const CommunityAdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kelola Komunitas')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: const [
            _CommunityIdentityCard(),
            SizedBox(height: 16),
            _PrayerSettingsCard(),
            SizedBox(height: 16),
            _RtManagementCard(),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.description,
    required this.child,
  });

  final String title;
  final String description;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: KomplekkuColors.surface,
        border: Border.all(color: KomplekkuColors.border),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            description,
            style: const TextStyle(color: KomplekkuColors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _CommunityIdentityCard extends ConsumerStatefulWidget {
  const _CommunityIdentityCard();

  @override
  ConsumerState<_CommunityIdentityCard> createState() => _CommunityIdentityCardState();
}

class _CommunityIdentityCardState extends ConsumerState<_CommunityIdentityCard> {
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _rwController = TextEditingController();
  bool _hydrated = false;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _rwController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(communityAdminRepositoryProvider).updateCommunity(
            name: _nameController.text.trim(),
            address: _addressController.text.trim(),
            rwLabel: _rwController.text.trim(),
          );
      ref.invalidate(currentCommunityProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final community = ref.watch(currentCommunityProvider);

    return _SectionCard(
      title: 'Identitas komunitas',
      description: 'RW saat ini menaungi beberapa RT. Ubah label RW di sini bila strukturnya berubah.',
      child: community.when(
        loading: () => const Padding(
          padding: EdgeInsets.symmetric(vertical: 12),
          child: Center(child: CircularProgressIndicator()),
        ),
        error: (error, _) => StatePanel(
          icon: Icons.cloud_off_outlined,
          title: 'Data komunitas belum bisa dimuat',
          message: error is ApiException ? error.message : 'Terjadi kendala.',
          actionLabel: 'Coba lagi',
          onAction: () => ref.invalidate(currentCommunityProvider),
        ),
        data: (data) {
          if (!_hydrated) {
            _nameController.text = data.name;
            _addressController.text = data.address ?? '';
            _rwController.text = data.rwLabel ?? '';
            _hydrated = true;
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Nama komunitas'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _addressController,
                decoration: const InputDecoration(labelText: 'Alamat'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _rwController,
                decoration: const InputDecoration(labelText: 'Label RW', hintText: 'RW 13'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: KomplekkuColors.danger, fontSize: 12)),
              ],
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Menyimpan…' : 'Simpan identitas'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PrayerSettingsCard extends ConsumerStatefulWidget {
  const _PrayerSettingsCard();

  @override
  ConsumerState<_PrayerSettingsCard> createState() => _PrayerSettingsCardState();
}

class _PrayerSettingsCardState extends ConsumerState<_PrayerSettingsCard> {
  final _delayController = TextEditingController();
  bool _hydrated = false;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _delayController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final delay = int.tryParse(_delayController.text.trim());
    if (delay == null || delay < 1 || delay > 60) {
      setState(() => _error = 'Masukkan angka bulat dari 1 sampai 60 menit.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref
          .read(communityAdminRepositoryProvider)
          .updateCommunity(iqomahDelayMinutes: delay);
      ref.invalidate(currentCommunityProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Jeda iqomah tersimpan untuk semua waktu shalat.')),
        );
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final community = ref.watch(currentCommunityProvider);
    return _SectionCard(
      title: 'Pengaturan shalat',
      description:
          'Satu jeda berlaku untuk Subuh, Dzuhur, Ashar, Maghrib, dan Isya di seluruh komunitas.',
      child: community.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => StatePanel(
          icon: Icons.cloud_off_outlined,
          title: 'Pengaturan belum bisa dimuat',
          message: error is ApiException ? error.message : 'Terjadi kendala.',
          actionLabel: 'Coba lagi',
          onAction: () => ref.invalidate(currentCommunityProvider),
        ),
        data: (data) {
          if (!_hydrated) {
            _delayController.text = data.iqomahDelayMinutes.toString();
            _hydrated = true;
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _delayController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Jeda adzan ke iqomah',
                  suffixText: 'menit',
                  helperText: 'Masukkan 1 sampai 60 menit. Nilai awal 10 menit.',
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: const TextStyle(color: KomplekkuColors.danger, fontSize: 12),
                ),
              ],
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: const Icon(Icons.schedule_outlined),
                label: Text(_saving ? 'Menyimpan…' : 'Simpan pengaturan shalat'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _RtManagementCard extends ConsumerStatefulWidget {
  const _RtManagementCard();

  @override
  ConsumerState<_RtManagementCard> createState() => _RtManagementCardState();
}

class _RtManagementCardState extends ConsumerState<_RtManagementCard> {
  final _codeController = TextEditingController();
  final _nameController = TextEditingController();
  bool _creating = false;
  String? _createError;
  String? _editingId;
  final _editController = TextEditingController();
  bool _renaming = false;

  @override
  void dispose() {
    _codeController.dispose();
    _nameController.dispose();
    _editController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final code = _codeController.text.trim();
    final name = _nameController.text.trim();
    if (code.isEmpty || name.isEmpty) return;
    setState(() {
      _creating = true;
      _createError = null;
    });
    try {
      await ref.read(communityAdminRepositoryProvider).createRt(code: code, name: name);
      ref.invalidate(rtListProvider);
      _codeController.clear();
      _nameController.clear();
    } on ApiException catch (error) {
      if (mounted) setState(() => _createError = error.message);
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  Future<void> _rename(String rtId) async {
    setState(() => _renaming = true);
    try {
      await ref.read(communityAdminRepositoryProvider).updateRt(
            rtId,
            name: _editController.text.trim(),
          );
      ref.invalidate(rtListProvider);
      if (mounted) setState(() => _editingId = null);
    } on ApiException catch (_) {
      // Row-level error omitted to keep this in parity with the simplest
      // case; the list simply won't update and the user can retry.
    } finally {
      if (mounted) setState(() => _renaming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rts = ref.watch(rtListProvider);

    return _SectionCard(
      title: 'RT dalam komunitas',
      description:
          'Warga memilih salah satu RT ini saat mendaftar, dan Ketua RT hanya dapat mengelola RT yang ditugaskan padanya.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          rts.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => StatePanel(
              icon: Icons.cloud_off_outlined,
              title: 'Daftar RT belum bisa dimuat',
              message: error is ApiException ? error.message : 'Terjadi kendala.',
              actionLabel: 'Coba lagi',
              onAction: () => ref.invalidate(rtListProvider),
            ),
            data: (items) {
              if (items.isEmpty) {
                return const StatePanel(
                  icon: Icons.map_outlined,
                  title: 'Belum ada RT terdaftar',
                  message: 'RT yang ditambahkan akan muncul di daftar ini.',
                );
              }
              return Column(
                children: items.map((rt) => _rtRow(rt)).toList(),
              );
            },
          ),
          const SizedBox(height: 14),
          const Divider(),
          const SizedBox(height: 10),
          Text('Tambah RT baru', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          TextField(
            controller: _codeController,
            decoration: const InputDecoration(labelText: 'Kode RT baru', hintText: 'RT 03'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Nama RT baru', hintText: 'RT 03'),
          ),
          if (_createError != null) ...[
            const SizedBox(height: 8),
            Text(_createError!, style: const TextStyle(color: KomplekkuColors.danger, fontSize: 12)),
          ],
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _creating ? null : _create,
            child: Text(_creating ? 'Menyimpan…' : 'Tambah RT'),
          ),
        ],
      ),
    );
  }

  Widget _rtRow(RtOption rt) {
    final isEditing = _editingId == rt.id;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: KomplekkuColors.surfaceSoft,
          borderRadius: BorderRadius.circular(12),
        ),
        child: isEditing
            ? Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _editController,
                      decoration: const InputDecoration(isDense: true),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _renaming ? null : () => _rename(rt.id),
                    icon: const Icon(Icons.check),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _editingId = null),
                    icon: const Icon(Icons.close),
                  ),
                ],
              )
            : Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(rt.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                        Text(
                          'Kode ${rt.code}',
                          style: const TextStyle(color: KomplekkuColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() {
                      _editingId = rt.id;
                      _editController.text = rt.name;
                    }),
                    child: const Text('Ubah nama'),
                  ),
                ],
              ),
      ),
    );
  }
}
