import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/admin_role/data/admin_role_repository.dart';
import 'package:komplekku/features/admin_role/domain/admin_role_models.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

class AdminRoleScreen extends ConsumerStatefulWidget {
  const AdminRoleScreen({super.key});

  @override
  ConsumerState<AdminRoleScreen> createState() => _AdminRoleScreenState();
}

class _AdminRoleScreenState extends ConsumerState<AdminRoleScreen> {
  final Map<String, String> _roleDraft = {};
  final Map<String, String> _rtDraft = {};
  String? _pendingResidentId;
  String? _rowErrorResidentId;
  String? _rowErrorMessage;

  Future<void> _apply(CommunityMember member, List<RoleOption> roles) async {
    final draftRole = _roleDraft[member.residentId] ?? member.roles.firstOrNull?.code ?? '';
    final needsRt = draftRole == 'RT_ADMIN';
    final rtId = _rtDraft[member.residentId];
    if (draftRole.isEmpty || (needsRt && rtId == null)) return;

    setState(() {
      _pendingResidentId = member.residentId;
      _rowErrorResidentId = null;
    });
    try {
      await ref.read(adminRoleRepositoryProvider).setMemberRole(
            residentId: member.residentId,
            roleCode: draftRole,
            rtId: needsRt ? rtId : null,
          );
      ref.invalidate(communityMemberListProvider);
      setState(() {
        _roleDraft.remove(member.residentId);
        _rtDraft.remove(member.residentId);
      });
    } on ApiException catch (error) {
      setState(() {
        _rowErrorResidentId = member.residentId;
        _rowErrorMessage = error.message;
      });
    } finally {
      if (mounted) setState(() => _pendingResidentId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final roles = ref.watch(roleListProvider);
    final members = ref.watch(communityMemberListProvider);
    final rts = ref.watch(rtListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Kelola Pengguna')),
      body: SafeArea(
        child: roles.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => StatePanel(
            icon: Icons.cloud_off_outlined,
            title: 'Data peran belum bisa dimuat',
            message: error is ApiException ? error.message : 'Terjadi kendala.',
            actionLabel: 'Coba lagi',
            onAction: () => ref.invalidate(roleListProvider),
          ),
          data: (roleOptions) => members.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => StatePanel(
              icon: Icons.cloud_off_outlined,
              title: 'Daftar pengguna belum bisa dimuat',
              message: error is ApiException ? error.message : 'Terjadi kendala.',
              actionLabel: 'Coba lagi',
              onAction: () => ref.invalidate(communityMemberListProvider),
            ),
            data: (memberList) {
              if (memberList.isEmpty) {
                return const StatePanel(
                  icon: Icons.groups_outlined,
                  title: 'Belum ada warga aktif',
                  message: 'Warga yang sudah aktif di komunitas ini akan muncul di daftar ini.',
                );
              }
              final rtOptions = rts.maybeWhen(data: (v) => v, orElse: () => const []);
              return ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.base),
                itemCount: memberList.length,
                separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.md),
                itemBuilder: (context, index) =>
                    _memberRow(memberList[index], roleOptions, rtOptions),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _memberRow(CommunityMember member, List<RoleOption> roles, List rtOptions) {
    final currentRoleCode = member.roles.firstOrNull?.code ?? '';
    final draftRole = _roleDraft[member.residentId] ?? currentRoleCode;
    final needsRt = draftRole == 'RT_ADMIN';
    final isPending = _pendingResidentId == member.residentId;
    final roleChanged = draftRole != currentRoleCode;
    final canApply = roleChanged && (!needsRt || _rtDraft[member.residentId] != null);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            member.displayName,
            style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            [
              member.phoneMasked,
              if (member.houseCode != null) member.houseCode!,
              if (member.rtCode != null) member.rtCode!,
            ].join(' · '),
            style: AppTypography.tabular(AppTypography.caption),
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: draftRole.isEmpty ? null : draftRole,
            decoration: const InputDecoration(labelText: 'Peran', isDense: true),
            hint: const Text('Belum ada peran'),
            items: roles
                .map((role) => DropdownMenuItem(value: role.code, child: Text(role.name)))
                .toList(),
            onChanged: isPending
                ? null
                : (value) {
                    if (value != null) {
                      setState(() => _roleDraft[member.residentId] = value);
                    }
                  },
          ),
          if (needsRt) ...[
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue: _rtDraft[member.residentId],
              decoration: const InputDecoration(labelText: 'RT', isDense: true),
              hint: const Text('Pilih RT'),
              items: rtOptions
                  .map<DropdownMenuItem<String>>(
                      (rt) => DropdownMenuItem(value: rt.id as String, child: Text(rt.name as String)))
                  .toList(),
              onChanged: isPending
                  ? null
                  : (value) {
                      if (value != null) {
                        setState(() => _rtDraft[member.residentId] = value);
                      }
                    },
            ),
          ],
          if (_rowErrorResidentId == member.residentId) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              _rowErrorMessage ?? '',
              style: AppTypography.caption.copyWith(color: AppColors.danger),
            ),
          ],
          if (roleChanged) ...[
            const SizedBox(height: AppSpacing.md),
            Align(
              alignment: Alignment.centerRight,
              child: AppButton(
                label: isPending ? 'Menyimpan…' : 'Terapkan',
                isLoading: isPending,
                expand: false,
                onPressed: isPending || !canApply ? null : () => _apply(member, roles),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
