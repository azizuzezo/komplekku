import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:komplekku/features/house_admin/data/house_admin_repository.dart';
import 'package:komplekku/features/house_admin/domain/house_admin.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';
import 'package:komplekku/shared/widgets/app_text_field.dart';

class HouseAdminScreen extends ConsumerStatefulWidget {
  const HouseAdminScreen({super.key});

  @override
  ConsumerState<HouseAdminScreen> createState() => _HouseAdminScreenState();
}

class _HouseAdminScreenState extends ConsumerState<HouseAdminScreen> {
  final _codeController = TextEditingController();
  final _blockController = TextEditingController();
  final _numberController = TextEditingController();
  String? _rtId;
  OccupancyStatus _occupancy = OccupancyStatus.vacant;
  bool _creating = false;
  String? _createError;
  final Map<String, bool> _reassigning = {};

  @override
  void dispose() {
    _codeController.dispose();
    _blockController.dispose();
    _numberController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final code = _codeController.text.trim();
    final block = _blockController.text.trim();
    final number = _numberController.text.trim();
    if (code.isEmpty || block.isEmpty || number.isEmpty || _rtId == null) {
      setState(() => _createError = 'Lengkapi kode, blok, nomor, dan RT.');
      return;
    }
    setState(() {
      _creating = true;
      _createError = null;
    });
    try {
      await ref.read(houseAdminRepositoryProvider).create(
            code: code,
            block: block,
            number: number,
            rtId: _rtId!,
            occupancyStatus: _occupancy,
          );
      ref.invalidate(houseAdminListProvider);
      _codeController.clear();
      _blockController.clear();
      _numberController.clear();
      setState(() {
        _rtId = null;
        _occupancy = OccupancyStatus.vacant;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _createError = error.message);
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  Future<void> _reassign(String houseId, String rtId) async {
    setState(() => _reassigning[houseId] = true);
    try {
      await ref.read(houseAdminRepositoryProvider).updateRt(houseId, rtId);
      ref.invalidate(houseAdminListProvider);
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _reassigning[houseId] = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final houses = ref.watch(houseAdminListProvider);
    final rts = ref.watch(rtListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Kelola Rumah')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            _buildForm(rts),
            const SizedBox(height: AppSpacing.base),
            _buildList(houses, rts),
          ],
        ),
      ),
    );
  }

  Widget _buildForm(AsyncValue<List<RtOption>> rts) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Tambah rumah', style: AppTypography.title),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Nama blok mendukung format apa pun, misalnya blok bertingkat seperti "F2D2 No.17".',
            style: AppTypography.caption,
          ),
          const SizedBox(height: AppSpacing.base),
          AppTextField(
            controller: _codeController,
            label: 'Kode rumah',
            hint: 'F2D2-17',
          ),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(
            controller: _blockController,
            label: 'Blok',
            hint: 'F2D2',
          ),
          const SizedBox(height: AppSpacing.sm),
          AppTextField(
            controller: _numberController,
            label: 'Nomor rumah',
            hint: '17',
          ),
          const SizedBox(height: AppSpacing.sm),
          rts.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, _) => Text(
              'Daftar RT belum bisa dimuat.',
              style: AppTypography.caption.copyWith(color: AppColors.danger),
            ),
            data: (items) => DropdownButtonFormField<String>(
              initialValue: _rtId,
              decoration: const InputDecoration(labelText: 'RT'),
              items: items
                  .map((rt) => DropdownMenuItem(value: rt.id, child: Text(rt.name)))
                  .toList(),
              onChanged: (value) => setState(() => _rtId = value),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<OccupancyStatus>(
            initialValue: _occupancy,
            decoration: const InputDecoration(labelText: 'Status hunian'),
            items: OccupancyStatus.values
                .map((status) => DropdownMenuItem(
                      value: status,
                      child: Text(occupancyStatusLabel(status)),
                    ))
                .toList(),
            onChanged: (value) {
              if (value != null) setState(() => _occupancy = value);
            },
          ),
          if (_createError != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(_createError!, style: AppTypography.caption.copyWith(color: AppColors.danger)),
          ],
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: _creating ? 'Menyimpan…' : 'Tambah rumah',
            isLoading: _creating,
            onPressed: _creating ? null : _create,
          ),
        ],
      ),
    );
  }

  Widget _buildList(AsyncValue<List<HouseAdmin>> houses, AsyncValue<List<RtOption>> rts) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Daftar rumah', style: AppTypography.title),
          const SizedBox(height: AppSpacing.base),
          houses.when(
            loading: () => const AppLoadingState(),
            error: (error, _) => StatePanel(
              icon: Icons.cloud_off_outlined,
              title: 'Daftar rumah belum bisa dimuat',
              message: error is ApiException ? error.message : 'Terjadi kendala.',
              actionLabel: 'Coba lagi',
              onAction: () => ref.invalidate(houseAdminListProvider),
            ),
            data: (items) {
              if (items.isEmpty) {
                return const StatePanel(
                  icon: Icons.home_outlined,
                  title: 'Belum ada rumah terdaftar',
                  message: 'Rumah yang ditambahkan akan muncul di daftar ini.',
                );
              }
              final rtOptions = rts.maybeWhen(data: (v) => v, orElse: () => const <RtOption>[]);
              return Column(
                children: [
                  for (final house in items) ...[
                    _houseRow(house, rtOptions),
                    if (house != items.last)
                      const Divider(height: AppSpacing.lg, color: AppColors.border),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  AppBadgeTone _occupancyTone(OccupancyStatus status) => switch (status) {
        OccupancyStatus.ownerOccupied => AppBadgeTone.success,
        OccupancyStatus.rented => AppBadgeTone.brand,
        OccupancyStatus.vacant => AppBadgeTone.warning,
      };

  Widget _houseRow(HouseAdmin house, List<RtOption> rts) {
    final isBusy = _reassigning[house.id] ?? false;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(house.addressLabel, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Row(
                children: [
                  AppBadge(
                    label: occupancyStatusLabel(house.occupancyStatus),
                    tone: _occupancyTone(house.occupancyStatus),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text('Kode ${house.code}', style: AppTypography.tabular(AppTypography.caption)),
                ],
              ),
              if (house.hasHousehold) ...[
                const SizedBox(height: 4),
                Text('Sudah ada rumah tangga', style: AppTypography.caption),
              ],
            ],
          ),
        ),
        if (rts.length > 1)
          isBusy
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : DropdownButton<String>(
                  value: house.rtId,
                  underline: const SizedBox.shrink(),
                  items: rts
                      .map((rt) => DropdownMenuItem(value: rt.id, child: Text(rt.name)))
                      .toList(),
                  onChanged: (value) {
                    if (value != null) _reassign(house.id, value);
                  },
                ),
      ],
    );
  }
}
