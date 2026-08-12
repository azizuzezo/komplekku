import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/letter/data/letter_repository.dart';
import 'package:komplekku/features/letter/domain/letter.dart';
import 'package:komplekku/features/letter/presentation/letter_form_controller.dart';

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
          loading: () => const _LetterListSkeleton(),
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
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
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
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => const _LetterCreateSheet(),
    );
  }
}

Color letterStatusToneColor(LetterStatusTone tone) {
  switch (tone) {
    case LetterStatusTone.success:
      return KomplekkuColors.success;
    case LetterStatusTone.warning:
      return KomplekkuColors.terracotta;
    case LetterStatusTone.danger:
      return KomplekkuColors.danger;
    case LetterStatusTone.muted:
      return KomplekkuColors.textSecondary;
  }
}

class _LetterStatusBadge extends StatelessWidget {
  const _LetterStatusBadge({required this.status});

  final LetterRequestStatus status;

  @override
  Widget build(BuildContext context) {
    final color = letterStatusToneColor(letterRequestStatusTone(status));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        letterRequestStatusLabels[status]!,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

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
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    request.letterTypeName,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                _LetterStatusBadge(status: request.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(request.purpose, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 10),
            Text(
              widget.canManage
                  ? '${request.requesterName} · ${request.houseCode} · Diajukan ${formatLetterDateTime(request.createdAt)}'
                  : 'Diajukan ${formatLetterDateTime(request.createdAt)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KomplekkuColors.textSecondary,
                  ),
            ),
            if (request.status == LetterRequestStatus.rejected &&
                request.rejectionReason != null) ...[
              const SizedBox(height: 8),
              Text(
                'Alasan penolakan: ${request.rejectionReason}',
                style: const TextStyle(color: KomplekkuColors.danger),
              ),
            ],
            if (request.status == LetterRequestStatus.ready) ...[
              const SizedBox(height: 8),
              const Text(
                'Dokumen siap diambil di sekretariat pengurus.',
                style: TextStyle(color: KomplekkuColors.success),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _error!.message,
                style: const TextStyle(color: KomplekkuColors.danger),
              ),
            ],
            if (widget.canManage &&
                request.status == LetterRequestStatus.submitted &&
                !_isRejecting) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  FilledButton(
                    onPressed: _isSubmitting
                        ? null
                        : () => _run(
                              () => ref
                                  .read(letterRepositoryProvider)
                                  .approve(request.id),
                            ),
                    child: const Text('Setujui'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: _isSubmitting
                        ? null
                        : () => setState(() => _isRejecting = true),
                    child: const Text('Tolak'),
                  ),
                ],
              ),
            ],
            if (widget.canManage &&
                request.status == LetterRequestStatus.submitted &&
                _isRejecting) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _rejectReasonController,
                decoration: const InputDecoration(
                  labelText: 'Alasan penolakan',
                  helperText: 'Alasan ini akan terlihat oleh warga yang mengajukan.',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  FilledButton(
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
                    child: const Text('Konfirmasi penolakan'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: _isSubmitting
                        ? null
                        : () => setState(() {
                              _isRejecting = false;
                              _error = null;
                            }),
                    child: const Text('Batal'),
                  ),
                ],
              ),
            ],
            if (widget.canManage &&
                request.status == LetterRequestStatus.approved) ...[
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _isSubmitting
                    ? null
                    : () => _run(
                          () => ref
                              .read(letterRepositoryProvider)
                              .markReady(request.id),
                        ),
                child: const Text('Tandai siap'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _LetterListSkeleton extends StatelessWidget {
  const _LetterListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat permohonan surat',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 100,
            decoration: BoxDecoration(
              color: KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
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
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Ajukan surat baru',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              typesAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: LinearProgressIndicator(),
                ),
                error: (error, _) => Text(
                  'Jenis surat belum bisa dimuat. Coba lagi.',
                  style: const TextStyle(color: KomplekkuColors.danger),
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
              const SizedBox(height: 12),
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
                const SizedBox(height: 12),
                Text(
                  submissionError.message,
                  style: const TextStyle(color: KomplekkuColors.danger),
                ),
              ],
              const SizedBox(height: 12),
              Text(
                'Surat yang diterbitkan melalui Komplekku adalah surat keterangan dari '
                'pengurus lingkungan, bukan dokumen resmi pemerintah.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Ajukan permohonan'),
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
