import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';
import 'package:komplekku/shared/widgets/app_text_field.dart';

class CommunityAdminScreen extends ConsumerWidget {
  const CommunityAdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kelola Komunitas')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: const [
            _CommunityIdentityCard(),
            SizedBox(height: AppSpacing.base),
            _PrayerSettingsCard(),
            SizedBox(height: AppSpacing.base),
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
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.title),
          const SizedBox(height: AppSpacing.xs),
          Text(
            description,
            style: AppTypography.caption,
          ),
          const SizedBox(height: AppSpacing.base),
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
          padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
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
              AppTextField(
                controller: _nameController,
                label: 'Nama komunitas',
              ),
              const SizedBox(height: AppSpacing.sm),
              AppTextField(
                controller: _addressController,
                label: 'Alamat',
              ),
              const SizedBox(height: AppSpacing.sm),
              AppTextField(
                controller: _rwController,
                label: 'Label RW',
                hint: 'RW 13',
              ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.xs),
                Text(_error!, style: AppTypography.caption.copyWith(color: AppColors.danger)),
              ],
              const SizedBox(height: AppSpacing.md),
              AppButton(
                label: _saving ? 'Menyimpan…' : 'Simpan identitas',
                isLoading: _saving,
                onPressed: _saving ? null : _save,
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
        loading: () => const AppLoadingState(),
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
                const SizedBox(height: AppSpacing.xs),
                Text(
                  _error!,
                  style: AppTypography.caption.copyWith(color: AppColors.danger),
                ),
              ],
              const SizedBox(height: AppSpacing.md),
              AppButton(
                label: _saving ? 'Menyimpan…' : 'Simpan pengaturan shalat',
                icon: Icons.schedule_outlined,
                isLoading: _saving,
                onPressed: _saving ? null : _save,
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
              padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
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
                children: [
                  for (final rt in items) ...[
                    _rtRow(rt),
                    if (rt != items.last) const Divider(height: AppSpacing.lg, color: AppColors.border),
                  ],
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(color: AppColors.border),
          const SizedBox(height: AppSpacing.sm),
          Text('Tambah RT baru', style: AppTypography.title),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(
            controller: _codeController,
            label: 'Kode RT baru',
            hint: 'RT 03',
          ),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(
            controller: _nameController,
            label: 'Nama RT baru',
            hint: 'RT 03',
          ),
          if (_createError != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(_createError!, style: AppTypography.caption.copyWith(color: AppColors.danger)),
          ],
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: _creating ? 'Menyimpan…' : 'Tambah RT',
            isLoading: _creating,
            onPressed: _creating ? null : _create,
          ),
        ],
      ),
    );
  }

  Widget _rtRow(RtOption rt) {
    final isEditing = _editingId == rt.id;
    if (isEditing) {
      return Row(
        children: [
          Expanded(
            child: AppTextField(
              controller: _editController,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          IconButton(
            onPressed: _renaming ? null : () => _rename(rt.id),
            icon: const Icon(Icons.check),
          ),
          IconButton(
            onPressed: () => setState(() => _editingId = null),
            icon: const Icon(Icons.close),
          ),
        ],
      );
    }
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(rt.name, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              AppBadge(label: rt.code, tone: AppBadgeTone.brand),
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
    );
  }
}
