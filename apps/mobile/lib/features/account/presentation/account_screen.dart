import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_dialog.dart';
import 'package:komplekku/shared/widgets/app_header.dart';
import 'package:komplekku/shared/widgets/app_text_field.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/account/data/account_repository.dart';
import 'package:komplekku/features/account/domain/account_snapshot.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/household/data/household_repository.dart';
import 'package:komplekku/features/household/domain/household.dart';
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
      backgroundColor: AppColors.background,
      appBar: AppBar(
        toolbarHeight: 92,
        titleSpacing: 20,
        automaticallyImplyLeading: false,
        title: AppHeader(
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
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.base,
              AppSpacing.sm,
              AppSpacing.base,
              AppSpacing.xxl,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _CredentialCard(snapshot: snapshot),
                if (snapshot.hasActiveResidency) ...[
                  const SizedBox(height: AppSpacing.base),
                  const _HouseholdSection(),
                ],
                const SizedBox(height: AppSpacing.base),
                _SessionCard(isLoggingOut: _isLoggingOut, onLogout: _logout),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

AppBadgeTone _statusBadgeTone(AccountResidentStatus? status) {
  switch (status) {
    case AccountResidentStatus.active:
      return AppBadgeTone.success;
    case AccountResidentStatus.pending:
      return AppBadgeTone.brand;
    case AccountResidentStatus.rejected:
    case AccountResidentStatus.suspended:
      return AppBadgeTone.danger;
    case AccountResidentStatus.movedOut:
    case null:
      return AppBadgeTone.neutral;
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
    final tone = _statusBadgeTone(snapshot.residentStatus);
    final statusLabel = snapshot.residentStatus != null
        ? residentStatusLabel(snapshot.residentStatus!)
        : null;

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.title,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      snapshot.phoneMasked,
                      style: AppTypography.tabular(AppTypography.body),
                    ),
                    if (statusLabel != null) ...[
                      const SizedBox(height: AppSpacing.sm),
                      AppBadge(
                        label: statusLabel,
                        tone: tone,
                        icon: Icons.verified_outlined,
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
                    backgroundColor: AppColors.surfaceSoft,
                    foregroundColor: AppColors.primary,
                  ),
                ),
            ],
          ),
          if (_isEditing) ...[
            const SizedBox(height: AppSpacing.base),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: AppTextField(
                    controller: _controller,
                    label: 'Nama warga',
                    autofocus: true,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _save(),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                IconButton.filled(
                  tooltip: 'Simpan nama',
                  onPressed: _isSaving ? null : _save,
                  icon: const Icon(Icons.check, size: 18),
                ),
                const SizedBox(width: AppSpacing.xs),
                IconButton.outlined(
                  tooltip: 'Batal',
                  onPressed: () => setState(() => _isEditing = false),
                  icon: const Icon(Icons.close, size: 18),
                ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                _error!,
                style: AppTypography.caption.copyWith(color: AppColors.danger),
              ),
            ],
          ],
          if (!snapshot.hasActiveResidency &&
              snapshot.residentStatus != null) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              _statusDescription(snapshot.residentStatus!),
              style: AppTypography.body,
            ),
          ],
          if (snapshot.hasActiveResidency && context_ != null) ...[
            const SizedBox(height: AppSpacing.lg),
            const Divider(),
            const SizedBox(height: AppSpacing.md),
            _ProfileLocationRow(
              icon: Icons.location_on_outlined,
              label: 'Lingkungan',
              value: context_.communityName,
            ),
            const SizedBox(height: AppSpacing.md),
            _ProfileLocationRow(
              icon: Icons.home_outlined,
              label: context_.house.code,
              value: context_.house.addressLabel,
            ),
            const SizedBox(height: AppSpacing.md),
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
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.surfaceMuted,
            borderRadius: BorderRadius.circular(AppRadius.small),
          ),
          child: Icon(icon, size: 19, color: AppColors.primary),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.caption),
              Text(
                value,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.label,
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

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showAppDialog(
      context: context,
      title: 'Keluar dari akun?',
      message: 'Kamu perlu masuk kembali untuk mengakses akun ini.',
      confirmLabel: 'Keluar',
      danger: true,
    );
    if (confirmed == true) onLogout();
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sesi akun', style: AppTypography.title),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Keluar jika perangkat ini dipakai bersama orang lain.',
            style: AppTypography.body,
          ),
          const SizedBox(height: AppSpacing.base),
          AppButton(
            label: 'Keluar dari akun',
            icon: Icons.logout,
            variant: AppButtonVariant.danger,
            isLoading: isLoggingOut,
            onPressed: isLoggingOut ? null : () => _confirmLogout(context),
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

  Future<void> _confirmRemove(String residentId, String displayName) async {
    final confirmed = await showAppDialog(
      context: context,
      title: 'Hapus $displayName?',
      message: 'Anggota ini akan dihapus dari rumah tangga.',
      confirmLabel: 'Hapus',
      danger: true,
    );
    if (confirmed == true) _remove(residentId);
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

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
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
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceSoft,
                        borderRadius: BorderRadius.circular(AppRadius.small),
                      ),
                      child: const Icon(
                        Icons.groups_outlined,
                        color: AppColors.primary,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Anggota Keluarga',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.title.copyWith(fontSize: 16),
                          ),
                          Text(
                            'Penghuni rumah tangga ini',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.caption,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (!_isAdding) ...[
                const SizedBox(width: AppSpacing.sm),
                AppButton(
                  label: 'Tambah',
                  icon: Icons.add,
                  variant: AppButtonVariant.secondary,
                  expand: false,
                  onPressed: () => setState(() => _isAdding = true),
                ),
              ],
            ],
          ),
          if (_isAdding) ...[
            const SizedBox(height: AppSpacing.md),
            const Divider(),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                const Icon(
                  Icons.person_add_alt_outlined,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text('Anggota Baru', style: AppTypography.label.copyWith(color: AppColors.primary)),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            AppTextField(controller: _nameController, hint: 'Nama lengkap'),
            const SizedBox(height: AppSpacing.sm),
            AppTextField(
              controller: _phoneController,
              hint: 'Nomor HP (08xxxxxxxxxx)',
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<HouseholdRelationship>(
              initialValue: _relationship,
              items: HouseholdRelationship.values
                  .where((r) => r != HouseholdRelationship.head)
                  .map(
                    (r) => DropdownMenuItem(value: r, child: Text(r.label)),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) setState(() => _relationship = value);
              },
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Anggota baru akan mendapatkan akun sendiri dan bisa masuk memakai nomor HP ini.',
              style: AppTypography.caption,
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                _error!,
                style: AppTypography.caption.copyWith(color: AppColors.danger),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                AppButton(
                  label: 'Batal',
                  variant: AppButtonVariant.ghost,
                  expand: false,
                  onPressed: () => setState(() {
                    _isAdding = false;
                    _error = null;
                  }),
                ),
                const SizedBox(width: AppSpacing.xs),
                AppButton(
                  label: 'Simpan',
                  variant: AppButtonVariant.primary,
                  expand: false,
                  isLoading: _isSaving,
                  onPressed: _isSaving ? null : _submitAdd,
                ),
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          const Divider(),
          const SizedBox(height: AppSpacing.sm),
          household.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
              child: Text(
                'Memuat anggota rumah tangga...',
                style: AppTypography.caption,
              ),
            ),
            error: (_, _) => Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Belum dapat memuat anggota rumah tangga.',
                      style: AppTypography.caption.copyWith(color: AppColors.danger),
                    ),
                  ),
                  AppButton(
                    label: 'Coba lagi',
                    variant: AppButtonVariant.ghost,
                    expand: false,
                    onPressed: () => ref.invalidate(currentHouseholdProvider),
                  ),
                ],
              ),
            ),
            data: (data) => Column(
              children: [
                for (var i = 0; i < data.members.length; i++) ...[
                  if (i != 0) const Divider(),
                  _HouseholdMemberRow(
                    member: data.members[i],
                    isSelf: account != null && data.members[i].userId == account.id,
                    isRemoving: _removingResidentId == data.members[i].residentId,
                    onRemove: () => _confirmRemove(
                      data.members[i].residentId,
                      data.members[i].displayName,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HouseholdMemberRow extends StatelessWidget {
  const _HouseholdMemberRow({
    required this.member,
    required this.isSelf,
    required this.isRemoving,
    required this.onRemove,
  });

  final HouseholdMember member;
  final bool isSelf;
  final bool isRemoving;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(AppRadius.small),
            ),
            child: const Icon(
              Icons.person_outline,
              size: 19,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
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
                        style: AppTypography.label,
                      ),
                    ),
                    if (isSelf) ...[
                      const SizedBox(width: AppSpacing.xs),
                      const AppBadge(label: 'Saya', tone: AppBadgeTone.brand),
                    ],
                  ],
                ),
                Text(
                  [
                    member.relationship.label,
                    if (member.phoneMasked != null) member.phoneMasked!,
                  ].join(' · '),
                  style: AppTypography.caption,
                ),
              ],
            ),
          ),
          if (!isSelf)
            IconButton(
              onPressed: isRemoving ? null : onRemove,
              icon: isRemoving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.delete_outline, size: 18),
              color: AppColors.textSecondary,
              tooltip: 'Hapus ${member.displayName}',
            ),
        ],
      ),
    );
  }
}
