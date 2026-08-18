import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:komplekku/features/house_admin/data/house_admin_repository.dart';
import 'package:komplekku/features/house_admin/domain/house_admin.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';

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
          padding: const EdgeInsets.all(16),
          children: [
            _buildForm(rts),
            const SizedBox(height: 16),
            _buildList(houses, rts),
          ],
        ),
      ),
    );
  }

  Widget _buildForm(AsyncValue<List<RtOption>> rts) {
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
          Text('Tambah rumah', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          const Text(
            'Nama blok mendukung format apa pun, misalnya blok bertingkat seperti "F2D2 No.17".',
            style: TextStyle(color: KomplekkuColors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _codeController,
            decoration: const InputDecoration(labelText: 'Kode rumah', hintText: 'F2D2-17'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _blockController,
            decoration: const InputDecoration(labelText: 'Blok', hintText: 'F2D2'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _numberController,
            decoration: const InputDecoration(labelText: 'Nomor rumah', hintText: '17'),
          ),
          const SizedBox(height: 10),
          rts.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, _) => const Text(
              'Daftar RT belum bisa dimuat.',
              style: TextStyle(color: KomplekkuColors.danger, fontSize: 12),
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
          const SizedBox(height: 10),
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
            const SizedBox(height: 8),
            Text(_createError!, style: const TextStyle(color: KomplekkuColors.danger, fontSize: 12)),
          ],
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _creating ? null : _create,
            child: Text(_creating ? 'Menyimpan…' : 'Tambah rumah'),
          ),
        ],
      ),
    );
  }

  Widget _buildList(AsyncValue<List<HouseAdmin>> houses, AsyncValue<List<RtOption>> rts) {
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
          Text('Daftar rumah', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          houses.when(
            loading: () => const Center(child: CircularProgressIndicator()),
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
                children: items
                    .map((house) => _houseRow(house, rtOptions))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _houseRow(HouseAdmin house, List<RtOption> rts) {
    final isBusy = _reassigning[house.id] ?? false;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: KomplekkuColors.surfaceSoft,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(house.addressLabel, style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text(
                    'Kode ${house.code} · ${occupancyStatusLabel(house.occupancyStatus)}'
                    '${house.hasHousehold ? ' · Sudah ada rumah tangga' : ''}',
                    style: const TextStyle(color: KomplekkuColors.textSecondary, fontSize: 12),
                  ),
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
        ),
      ),
    );
  }
}
