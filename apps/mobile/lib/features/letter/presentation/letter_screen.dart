import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/letter/data/letter_repository.dart';
import 'package:komplekku/features/letter/domain/letter.dart';
import 'package:komplekku/features/letter/presentation/letter_form_controller.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_bottom_sheet.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';

/// Resident + staff dual-mode screen for "Surat". Residents ajukan (submit)
/// letter requests and track their own history (`letter.create` /
/// `letter.read`); staff holding `letter.manage` see every request via the
/// same `GET /letters` call (scoped server-side) and can approve, reject, or
/// mark a request ready.
class LetterScreen extends ConsumerWidget {
  const LetterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canCreate = hasPermission(permissions, 'letter.create');
    final canManage = hasPermission(permissions, 'letter.manage');
    final requests = ref.watch(letterRequestListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Surat')),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateSheet(context),
              icon: const Icon(Icons.add),
              label: const Text('Ajukan surat'),
            )
          : null,
      body: SafeArea(
        child: requests.when(
          loading: () => Semantics(
            label: 'Memuat permohonan surat',
            liveRegion: true,
            child: const AppLoadingState.skeleton(rows: 4),
          ),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat permohonan surat.',
                actionLabel: 'Keluar',
                onAction: () =>
                    ref.read(sessionControllerProvider.notifier).signOut(),
              );
            }
            return StatePanel(
              icon: failure.isForbidden
                  ? Icons.block_outlined
                  : Icons.cloud_off_outlined,
              title: failure.isForbidden
                  ? 'Permohonan surat belum dapat diakses'
                  : 'Permohonan surat belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(letterRequestListProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return StatePanel(
                icon: Icons.mail_outline,
                title: 'Belum ada permohonan surat',
                message: canManage
                    ? 'Permohonan surat warga akan muncul di sini.'
                    : 'Permohonan surat yang kamu ajukan akan muncul di sini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(letterRequestListProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.base,
                  AppSpacing.md,
                  AppSpacing.base,
                  96,
                ),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return _LetterRequestCard(
                    request: item,
                    canManage: canManage,
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }

  void _openCreateSheet(BuildContext context) {
    showAppBottomSheet<void>(
      context: context,
      builder: (context) => const _LetterCreateSheet(),
    );
  }
}

Color letterStatusToneColor(LetterStatusTone tone) {
  switch (tone) {
    case LetterStatusTone.success:
      return AppColors.success;
    case LetterStatusTone.warning:
      return AppColors.accent;
    case LetterStatusTone.danger:
      return AppColors.danger;
    case LetterStatusTone.muted:
      return AppColors.textSecondary;
  }
}

AppBadgeTone _letterBadgeTone(LetterStatusTone tone) => switch (tone) {
  LetterStatusTone.muted => AppBadgeTone.neutral,
  LetterStatusTone.warning => AppBadgeTone.warning,
  LetterStatusTone.success => AppBadgeTone.success,
  LetterStatusTone.danger => AppBadgeTone.danger,
};

Widget _letterStatusBadge(LetterRequestStatus status) => AppBadge(
  label: letterRequestStatusLabels[status]!,
  tone: _letterBadgeTone(letterRequestStatusTone(status)),
);

class _LetterRequestCard extends ConsumerStatefulWidget {
  const _LetterRequestCard({required this.request, required this.canManage});

  final LetterRequest request;
  final bool canManage;

  @override
  ConsumerState<_LetterRequestCard> createState() =>
      _LetterRequestCardState();
}

class _LetterRequestCardState extends ConsumerState<_LetterRequestCard> {
  bool _isSubmitting = false;
  bool _isRejecting = false;
  ApiException? _error;
  final _rejectReasonController = TextEditingController();

  @override
  void dispose() {
    _rejectReasonController.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await action();
      if (!mounted) return;
      ref.invalidate(letterRequestListProvider);
      setState(() => _isRejecting = false);
    } catch (error) {
      setState(() {
        _error = error is ApiException
            ? error
            : ApiException.malformedResponse();
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  request.letterTypeName,
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              _letterStatusBadge(request.status),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(request.purpose, style: AppTypography.body),
          const SizedBox(height: AppSpacing.sm),
          Text(
            widget.canManage
                ? '${request.requesterName} · ${request.houseCode} · Diajukan ${formatLetterDateTime(request.createdAt)}'
                : 'Diajukan ${formatLetterDateTime(request.createdAt)}',
            style: AppTypography.tabular(AppTypography.caption),
          ),
          if (request.status == LetterRequestStatus.rejected &&
              request.rejectionReason != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Alasan penolakan: ${request.rejectionReason}',
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
          ],
          if (request.status == LetterRequestStatus.ready) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Dokumen siap diambil di sekretariat pengurus.',
              style: AppTypography.body.copyWith(color: AppColors.success),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              _error!.message,
              style: AppTypography.body.copyWith(color: AppColors.danger),
            ),
          ],
          if (widget.canManage &&
              request.status == LetterRequestStatus.submitted &&
              !_isRejecting) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Setujui',
                    expand: false,
                    isLoading: _isSubmitting,
                    onPressed: _isSubmitting
                        ? null
                        : () => _run(
                            () => ref
                                .read(letterRepositoryProvider)
                                .approve(request.id),
                          ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: AppButton(
                    label: 'Tolak',
                    variant: AppButtonVariant.secondary,
                    expand: false,
                    onPressed: _isSubmitting
                        ? null
                        : () => setState(() => _isRejecting = true),
                  ),
                ),
              ],
            ),
          ],
          if (widget.canManage &&
              request.status == LetterRequestStatus.submitted &&
              _isRejecting) ...[
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _rejectReasonController,
              decoration: const InputDecoration(
                labelText: 'Alasan penolakan',
                helperText:
                    'Alasan ini akan terlihat oleh warga yang mengajukan.',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Konfirmasi penolakan',
                    variant: AppButtonVariant.danger,
                    expand: false,
                    isLoading: _isSubmitting,
                    onPressed: _isSubmitting
                        ? null
                        : () {
                            final reason = _rejectReasonController.text.trim();
                            if (reason.length < 3) {
                              setState(() {
                                _error = const ApiException(
                                  'VALIDATION_ERROR',
                                  'Tulis alasan penolakan, minimal 3 karakter.',
                                );
                              });
                              return;
                            }
                            _run(
                              () => ref
                                  .read(letterRepositoryProvider)
                                  .reject(request.id, reason),
                            );
                          },
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: AppButton(
                    label: 'Batal',
                    variant: AppButtonVariant.secondary,
                    expand: false,
                    onPressed: _isSubmitting
                        ? null
                        : () => setState(() {
                            _isRejecting = false;
                            _error = null;
                          }),
                  ),
                ),
              ],
            ),
          ],
          if (widget.canManage &&
              request.status == LetterRequestStatus.approved) ...[
            const SizedBox(height: AppSpacing.md),
            AppButton(
              label: 'Tandai siap',
              isLoading: _isSubmitting,
              onPressed: _isSubmitting
                  ? null
                  : () => _run(
                      () =>
                          ref.read(letterRepositoryProvider).markReady(request.id),
                    ),
            ),
          ],
        ],
      ),
    );
  }
}

class _LetterCreateSheet extends ConsumerStatefulWidget {
  const _LetterCreateSheet();

  @override
  ConsumerState<_LetterCreateSheet> createState() =>
      _LetterCreateSheetState();
}

class _LetterCreateSheetState extends ConsumerState<_LetterCreateSheet> {
  final _formKey = GlobalKey<FormState>();
  final _purposeController = TextEditingController();
  String? _letterTypeId;

  @override
  void dispose() {
    _purposeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final letterTypeId = _letterTypeId;
    if (letterTypeId == null) return;
    final request = await ref.read(letterFormControllerProvider.notifier).submit(
          letterTypeId: letterTypeId,
          purpose: _purposeController.text,
        );
    if (request != null && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Permohonan terkirim. Pengurus lingkungan akan meninjau surat ini.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final formState = ref.watch(letterFormControllerProvider);
    final isSubmitting = formState.value?.isSubmitting ?? false;
    final submissionError = formState.value?.submissionError;
    final typesAsync = ref.watch(letterTypeListProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.lg,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Ajukan surat baru', style: AppTypography.title),
              const SizedBox(height: AppSpacing.base),
              typesAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: LinearProgressIndicator(),
                ),
                error: (error, _) => Text(
                  'Jenis surat belum bisa dimuat. Coba lagi.',
                  style: AppTypography.body.copyWith(color: AppColors.danger),
                ),
                data: (types) => DropdownButtonFormField<String>(
                  initialValue: _letterTypeId,
                  decoration: const InputDecoration(labelText: 'Jenis surat'),
                  items: types
                      .map(
                        (type) => DropdownMenuItem(
                          value: type.id,
                          child: Text(type.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => _letterTypeId = value),
                  validator: (value) =>
                      value == null ? 'Pilih jenis surat terlebih dahulu.' : null,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _purposeController,
                decoration: const InputDecoration(
                  labelText: 'Keperluan',
                  helperText:
                      'Jelaskan singkat untuk keperluan apa surat ini kamu perlukan.',
                ),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.trim().length < 3) {
                    return 'Tulis keperluan permohonan, minimal 3 karakter.';
                  }
                  return null;
                },
              ),
              if (submissionError != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  submissionError.message,
                  style: AppTypography.body.copyWith(color: AppColors.danger),
                ),
              ],
              const SizedBox(height: AppSpacing.md),
              Text(
                'Surat yang diterbitkan melalui Komplekku adalah surat keterangan dari '
                'pengurus lingkungan, bukan dokumen resmi pemerintah.',
                style: AppTypography.caption,
              ),
              const SizedBox(height: AppSpacing.lg),
              AppButton(
                label: 'Ajukan permohonan',
                isLoading: isSubmitting,
                onPressed: isSubmitting ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String formatLetterDateTime(DateTime value) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  final local = value.toLocal();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '${local.day} ${months[local.month - 1]} ${local.year} · $hour:$minute';
}
