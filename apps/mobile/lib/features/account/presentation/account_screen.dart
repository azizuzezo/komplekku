import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/prototype_header.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/account/data/account_repository.dart';
import 'package:komplekku/features/account/domain/account_snapshot.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/household/data/household_repository.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  bool _isLoggingOut = false;

  Future<void> _logout() async {
    if (_isLoggingOut) return;
    setState(() => _isLoggingOut = true);
    try {
      await ref.read(sessionControllerProvider.notifier).signOut();
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _isLoggingOut = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final account = ref.watch(accountSnapshotProvider);
    final snapshot = account.value;
    final profileContext = snapshot?.context;

    return Scaffold(
      backgroundColor: KomplekkuColors.background,
      appBar: AppBar(
        toolbarHeight: 92,
        titleSpacing: 20,
        automaticallyImplyLeading: false,
        title: PrototypeHeader(
          title: 'Profil',
          subtitle: profileContext == null
              ? 'Akun warga Komplekku'
              : '${profileContext.communityName} • ${profileContext.house.code}',
          showBack: true,
          showSearch: false,
        ),
      ),
      body: SafeArea(
        child: account.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat akunmu.',
                actionLabel: 'Keluar',
                onAction: _logout,
              );
            }
            return StatePanel(
              icon: Icons.cloud_off_outlined,
              title: 'Akun belum bisa dimuat',
              message: failure.message,
              actionLabel: 'Coba lagi',
              onAction: () => ref.invalidate(accountSnapshotProvider),
            );
          },
          data: (snapshot) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _CredentialCard(snapshot: snapshot),
                if (snapshot.hasActiveResidency) ...[
                  const SizedBox(height: 16),
                  const _HouseholdSection(),
                ],
                const SizedBox(height: 16),
                _SessionCard(isLoggingOut: _isLoggingOut, onLogout: _logout),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Color _statusTone(AccountResidentStatus? status) {
  switch (status) {
    case AccountResidentStatus.active:
      return KomplekkuColors.success;
    case AccountResidentStatus.pending:
      return KomplekkuColors.primary;
    case AccountResidentStatus.rejected:
    case AccountResidentStatus.suspended:
      return KomplekkuColors.danger;
    case AccountResidentStatus.movedOut:
    case null:
      return KomplekkuColors.textSecondary;
  }
}

class _CredentialCard extends ConsumerStatefulWidget {
  const _CredentialCard({required this.snapshot});

  final AccountSnapshot snapshot;

  @override
  ConsumerState<_CredentialCard> createState() => _CredentialCardState();
}

class _CredentialCardState extends ConsumerState<_CredentialCard> {
  bool _isEditing = false;
  bool _isSaving = false;
  String? _error;
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.snapshot.displayName ?? '',
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _controller.text.trim();
    if (name.length < 2) {
      setState(() => _error = 'Nama minimal 2 karakter.');
      return;
    }
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      await ref.read(accountRepositoryProvider).updateDisplayName(name);
      ref.invalidate(accountSnapshotProvider);
      if (mounted) setState(() => _isEditing = false);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final snapshot = widget.snapshot;
    final context_ = snapshot.context;
    final displayName = snapshot.displayName ?? 'Pengguna Komplekku';
    final tone = _statusTone(snapshot.residentStatus);
    final statusLabel = snapshot.residentStatus != null
        ? residentStatusLabel(snapshot.residentStatus!)
        : null;

    final initial = displayName.trim().isEmpty
        ? '?'
        : displayName.trim()[0].toUpperCase();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: KomplekkuColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: KomplekkuColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A101119),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: KomplekkuColors.surfaceMuted,
                child: Text(
                  initial,
                  style: const TextStyle(
                    color: KomplekkuColors.primaryDark,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      snapshot.phoneMasked,
                      style: const TextStyle(
                        color: KomplekkuColors.textSecondary,
                        fontSize: 13,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                    if (statusLabel != null) ...[
                      const SizedBox(height: 9),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: tone.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.verified_outlined,
                              size: 15,
                              color: tone,
                            ),
                            const SizedBox(width: 5),
                            Flexible(
                              child: Text(
                                statusLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: tone,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (!_isEditing)
                IconButton(
                  tooltip: 'Ubah nama',
                  onPressed: () => setState(() {
                    _controller.text = displayName;
                    _isEditing = true;
                    _error = null;
                  }),
                  icon: const Icon(Icons.edit_outlined),
                  style: IconButton.styleFrom(
                    backgroundColor: KomplekkuColors.surfaceSoft,
                    foregroundColor: KomplekkuColors.primary,
                  ),
                ),
            ],
          ),
          if (_isEditing) ...[
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    autofocus: true,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _save(),
                    decoration: const InputDecoration(
                      isDense: true,
                      labelText: 'Nama warga',
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  tooltip: 'Simpan nama',
                  onPressed: _isSaving ? null : _save,
                  icon: const Icon(Icons.check, size: 18),
                ),
                const SizedBox(width: 4),
                IconButton.outlined(
                  tooltip: 'Batal',
                  onPressed: () => setState(() => _isEditing = false),
                  icon: const Icon(Icons.close, size: 18),
                ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: 6),
              Text(
                _error!,
                style: const TextStyle(
                  color: KomplekkuColors.danger,
                  fontSize: 12,
                ),
              ),
            ],
          ],
          if (!snapshot.hasActiveResidency &&
              snapshot.residentStatus != null) ...[
            const SizedBox(height: 14),
            Text(
              _statusDescription(snapshot.residentStatus!),
              style: const TextStyle(color: KomplekkuColors.textSecondary),
            ),
          ],
          if (snapshot.hasActiveResidency && context_ != null) ...[
            const SizedBox(height: 18),
            const Divider(),
            const SizedBox(height: 14),
            _ProfileLocationRow(
              icon: Icons.location_on_outlined,
              label: 'Lingkungan',
              value: context_.communityName,
            ),
            const SizedBox(height: 12),
            _ProfileLocationRow(
              icon: Icons.home_outlined,
              label: context_.house.code,
              value: context_.house.addressLabel,
            ),
            const SizedBox(height: 12),
            _ProfileLocationRow(
              icon: Icons.groups_outlined,
              label: 'Rumah tangga',
              value: context_.householdDisplayName,
            ),
          ],
        ],
      ),
    );
  }

  String _statusDescription(AccountResidentStatus status) {
    switch (status) {
      case AccountResidentStatus.pending:
        return 'Permohonan tempat tinggalmu sedang diperiksa pengurus.';
      case AccountResidentStatus.rejected:
        return 'Permohonan tempat tinggal belum dapat disetujui.';
      case AccountResidentStatus.suspended:
        return 'Akses lingkungan untuk akun ini sedang ditangguhkan.';
      case AccountResidentStatus.movedOut:
        return 'Akun ini tidak lagi terhubung dengan rumah sebelumnya.';
      case AccountResidentStatus.active:
        return '';
    }
  }
}

class _ProfileLocationRow extends StatelessWidget {
  const _ProfileLocationRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: KomplekkuColors.surfaceMuted,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 19, color: KomplekkuColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: KomplekkuColors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                value,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: KomplekkuColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SessionCard extends StatelessWidget {
  const _SessionCard({required this.isLoggingOut, required this.onLogout});

  final bool isLoggingOut;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: KomplekkuColors.surface,
        border: Border.all(color: KomplekkuColors.border),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sesi akun', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          const Text('Keluar jika perangkat ini dipakai bersama orang lain.'),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: isLoggingOut ? null : onLogout,
            icon: const Icon(Icons.logout),
            label: Text(isLoggingOut ? 'Mengakhiri sesi…' : 'Keluar dari akun'),
            style: OutlinedButton.styleFrom(
              foregroundColor: KomplekkuColors.danger,
              side: const BorderSide(color: KomplekkuColors.danger),
            ),
          ),
        ],
      ),
    );
  }
}

class _HouseholdSection extends ConsumerStatefulWidget {
  const _HouseholdSection();

  @override
  ConsumerState<_HouseholdSection> createState() => _HouseholdSectionState();
}

class _HouseholdSectionState extends ConsumerState<_HouseholdSection> {
  bool _isAdding = false;
  bool _isSaving = false;
  String? _error;
  String? _removingResidentId;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  HouseholdRelationship _relationship = HouseholdRelationship.spouse;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submitAdd() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.isEmpty || phone.isEmpty) return;
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      await ref
          .read(householdRepositoryProvider)
          .addMember(fullName: name, phone: phone, relationship: _relationship);
      ref.invalidate(currentHouseholdProvider);
      if (mounted) {
        setState(() {
          _isAdding = false;
          _nameController.clear();
          _phoneController.clear();
          _relationship = HouseholdRelationship.spouse;
        });
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _remove(String residentId) async {
    setState(() => _removingResidentId = residentId);
    try {
      await ref.read(householdRepositoryProvider).removeMember(residentId);
      ref.invalidate(currentHouseholdProvider);
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _removingResidentId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final account = ref.watch(accountSnapshotProvider).value;
    final household = ref.watch(currentHouseholdProvider);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: KomplekkuColors.surface,
        border: Border.all(color: KomplekkuColors.surfaceMuted),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: KomplekkuColors.surfaceSoft,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.groups_outlined,
                        color: KomplekkuColors.primary,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Anggota Keluarga',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(
                              context,
                            ).textTheme.titleLarge?.copyWith(fontSize: 15),
                          ),
                          const Text(
                            'Penghuni rumah tangga ini',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: KomplekkuColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (!_isAdding) ...[
                const SizedBox(width: 10),
                FilledButton.icon(
                  onPressed: () => setState(() => _isAdding = true),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Tambah'),
                  style: FilledButton.styleFrom(
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    textStyle: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ],
          ),
          if (_isAdding) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: KomplekkuColors.background,
                border: Border.all(color: KomplekkuColors.border),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(
                        Icons.person_add_alt_outlined,
                        size: 14,
                        color: KomplekkuColors.primary,
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Anggota Baru',
                        style: TextStyle(
                          color: KomplekkuColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      isDense: true,
                      hintText: 'Nama lengkap',
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      isDense: true,
                      hintText: 'Nomor HP (08xxxxxxxxxx)',
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<HouseholdRelationship>(
                    initialValue: _relationship,
                    decoration: const InputDecoration(isDense: true),
                    items: HouseholdRelationship.values
                        .where((r) => r != HouseholdRelationship.head)
                        .map(
                          (r) =>
                              DropdownMenuItem(value: r, child: Text(r.label)),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null) setState(() => _relationship = value);
                    },
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Anggota baru akan mendapatkan akun sendiri dan bisa masuk memakai nomor HP ini.',
                    style: TextStyle(
                      color: KomplekkuColors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      _error!,
                      style: const TextStyle(
                        color: KomplekkuColors.danger,
                        fontSize: 12,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => setState(() {
                          _isAdding = false;
                          _error = null;
                        }),
                        child: const Text('Batal'),
                      ),
                      const SizedBox(width: 4),
                      FilledButton(
                        onPressed: _isSaving ? null : _submitAdd,
                        style: FilledButton.styleFrom(
                          minimumSize: Size.zero,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          textStyle: const TextStyle(fontSize: 12),
                        ),
                        child: Text(_isSaving ? 'Menyimpan...' : 'Simpan'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          household.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'Memuat anggota rumah tangga...',
                style: TextStyle(
                  color: KomplekkuColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ),
            error: (_, _) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Belum dapat memuat anggota rumah tangga.',
                      style: TextStyle(
                        color: KomplekkuColors.danger,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () => ref.invalidate(currentHouseholdProvider),
                    child: const Text('Coba lagi'),
                  ),
                ],
              ),
            ),
            data: (data) => Column(
              children: data.members.map((member) {
                final isSelf = account != null && member.userId == account.id;
                final isRemoving = _removingResidentId == member.residentId;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelf
                          ? KomplekkuColors.surfaceSoft
                          : KomplekkuColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: isSelf
                          ? null
                          : Border.all(color: KomplekkuColors.surfaceMuted),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: isSelf
                              ? KomplekkuColors.primary
                              : KomplekkuColors.surfaceSoft,
                          child: Text(
                            member.displayName.length >= 2
                                ? member.displayName
                                      .substring(0, 2)
                                      .toUpperCase()
                                : member.displayName.toUpperCase(),
                            style: TextStyle(
                              color: isSelf
                                  ? KomplekkuColors.surface
                                  : KomplekkuColors.textSecondary,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      member.displayName,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontWeight: isSelf
                                            ? FontWeight.w800
                                            : FontWeight.w700,
                                        fontSize: 14,
                                        color: KomplekkuColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                  if (isSelf) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: KomplekkuColors.textPrimary,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Text(
                                        'Saya',
                                        style: TextStyle(
                                          color: KomplekkuColors.borderStrong,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              Text(
                                [
                                  member.relationship.label,
                                  if (member.phoneMasked != null)
                                    member.phoneMasked!,
                                ].join(' · '),
                                style: const TextStyle(
                                  color: KomplekkuColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (!isSelf)
                          IconButton(
                            onPressed: isRemoving
                                ? null
                                : () => _remove(member.residentId),
                            icon: isRemoving
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.delete_outline, size: 18),
                            color: KomplekkuColors.textSecondary,
                            tooltip: 'Hapus ${member.displayName}',
                          ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
