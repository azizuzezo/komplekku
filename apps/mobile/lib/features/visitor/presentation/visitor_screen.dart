import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/visitor/data/visitor_repository.dart';
import 'package:komplekku/features/visitor/domain/visitor.dart';
import 'package:komplekku/features/visitor/presentation/visitor_controller.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';
import 'package:komplekku/shared/widgets/app_section_header.dart';

const _statusLabels = {
  VisitorStatus.pending: 'Menunggu kedatangan',
  VisitorStatus.checkedIn: 'Sudah check-in',
  VisitorStatus.checkedOut: 'Sudah check-out',
  VisitorStatus.cancelled: 'Dibatalkan',
};

AppBadgeTone _statusTone(VisitorStatus status) => switch (status) {
  VisitorStatus.pending => AppBadgeTone.warning,
  VisitorStatus.checkedIn => AppBadgeTone.success,
  VisitorStatus.checkedOut => AppBadgeTone.neutral,
  VisitorStatus.cancelled => AppBadgeTone.danger,
};

String _twoDigits(int value) => value.toString().padLeft(2, '0');

String _formatDateInput(DateTime value) {
  return '${value.year}-${_twoDigits(value.month)}-${_twoDigits(value.day)}';
}

String _formatVisitDateLabel(String isoDate) {
  final parts = isoDate.split('-');
  if (parts.length != 3) return isoDate;
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
  final month = int.tryParse(parts[1]);
  if (month == null || month < 1 || month > 12) return isoDate;
  return '${int.parse(parts[2])} ${months[month - 1]} ${parts[0]}';
}

/// "Tamu" screen, mirroring both `visitor-invite-panel.tsx` (resident: an
/// inline invite form that reveals the guest's QR token on success) and
/// `visitor-checkin-panel.tsx` (security: QR lookup + check-in, walk-in
/// registration, check-out) collapsed into one screen — the invite form
/// shows for `visitor.create` holders, the check-in tools show for
/// `visitor.checkin` holders, and the shared list below adapts its actions
/// to whichever permission the viewer has.
class VisitorScreen extends ConsumerStatefulWidget {
  const VisitorScreen({super.key});

  @override
  ConsumerState<VisitorScreen> createState() => _VisitorScreenState();
}

class _VisitorScreenState extends ConsumerState<VisitorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _guestNameController = TextEditingController();
  final _vehicleInfoController = TextEditingController();
  final _plateController = TextEditingController();
  final _purposeController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime? _visitDate;
  TimeOfDay? _expectedTime;
  bool _dateError = false;

  @override
  void dispose() {
    _guestNameController.dispose();
    _vehicleInfoController.dispose();
    _plateController.dispose();
    _purposeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickVisitDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _visitDate ?? now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _visitDate = picked;
        _dateError = false;
      });
    }
  }

  Future<void> _pickExpectedTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _expectedTime ?? TimeOfDay.now(),
    );
    if (picked != null) setState(() => _expectedTime = picked);
  }

  Future<void> _submit() async {
    final visitDate = _visitDate;
    final formValid = _formKey.currentState!.validate();
    if (visitDate == null) {
      setState(() => _dateError = true);
    }
    if (!formValid || visitDate == null) {
      return;
    }
    final expectedTime = _expectedTime;
    final ok = await ref.read(visitorInviteControllerProvider.notifier).submit(
          guestName: _guestNameController.text.trim(),
          visitDate: _formatDateInput(visitDate),
          expectedTime: expectedTime == null
              ? null
              : '${_twoDigits(expectedTime.hour)}:${_twoDigits(expectedTime.minute)}',
          vehicleInfo: _vehicleInfoController.text.trim(),
          plate: _plateController.text.trim(),
          purpose: _purposeController.text.trim(),
          notes: _notesController.text.trim(),
        );
    if (ok) {
      _formKey.currentState!.reset();
      _guestNameController.clear();
      _vehicleInfoController.clear();
      _plateController.clear();
      _purposeController.clear();
      _notesController.clear();
      setState(() {
        _visitDate = null;
        _expectedTime = null;
        _dateError = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final inviteState = ref.watch(visitorInviteControllerProvider);
    final permissions = ref.watch(currentPermissionsProvider);
    final canCreate = hasPermission(permissions, 'visitor.create');
    final canCheckin = hasPermission(permissions, 'visitor.checkin');

    return Scaffold(
      appBar: AppBar(title: const Text('Tamu')),
      body: SafeArea(
        child: inviteState.when(
          loading: () => const AppLoadingState(),
          error: (error, _) => StatePanel(
            icon: Icons.cloud_off_outlined,
            title: 'Undangan tamu belum bisa disiapkan',
            message: (error is ApiException
                    ? error
                    : ApiException.malformedResponse())
                .message,
            actionLabel: 'Coba lagi',
            onAction: () => ref.invalidate(visitorInviteControllerProvider),
          ),
          data: (state) {
            if (state.submissionError?.isForbidden ?? false) {
              return StatePanel(
                icon: Icons.block_outlined,
                title: 'Undangan tamu tidak dapat dibuat',
                message: state.submissionError!.message,
              );
            }
            if (state.submissionError?.isUnauthorized ?? false) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk mengundang tamu.',
                actionLabel: 'Keluar',
                onAction: () =>
                    ref.read(sessionControllerProvider.notifier).signOut(),
              );
            }
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.base,
                AppSpacing.md,
                AppSpacing.base,
                AppSpacing.xl,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (canCheckin) ...[
                    const _VisitorCheckinSection(),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                  if (canCreate) ...[
                  Text(
                    'Undang tamu dan bagikan kode QR yang ditunjukkan ke '
                    'petugas keamanan saat mereka tiba.',
                    style: AppTypography.body,
                  ),
                  const SizedBox(height: AppSpacing.base),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _guestNameController,
                          enabled: !state.isSubmitting,
                          textCapitalization: TextCapitalization.words,
                          textInputAction: TextInputAction.next,
                          inputFormatters: [
                            LengthLimitingTextInputFormatter(160),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Nama tamu',
                          ),
                          validator: (value) {
                            if ((value?.trim().length ?? 0) < 2) {
                              return 'Masukkan nama tamu, minimal 2 karakter.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: AppSpacing.base),
                        InkWell(
                          onTap: state.isSubmitting ? null : _pickVisitDate,
                          child: InputDecorator(
                            decoration: InputDecoration(
                              labelText: 'Tanggal kunjungan',
                              errorText: _dateError
                                  ? 'Pilih tanggal kunjungan.'
                                  : null,
                            ),
                            child: Text(
                              _visitDate == null
                                  ? 'Pilih tanggal'
                                  : _formatVisitDateLabel(
                                      _formatDateInput(_visitDate!),
                                    ),
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.base),
                        InkWell(
                          onTap: state.isSubmitting ? null : _pickExpectedTime,
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Perkiraan waktu (opsional)',
                            ),
                            child: Text(
                              _expectedTime == null
                                  ? 'Pilih waktu'
                                  : '${_twoDigits(_expectedTime!.hour)}:${_twoDigits(_expectedTime!.minute)}',
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.base),
                        TextFormField(
                          controller: _vehicleInfoController,
                          enabled: !state.isSubmitting,
                          textInputAction: TextInputAction.next,
                          inputFormatters: [
                            LengthLimitingTextInputFormatter(160),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Kendaraan (opsional)',
                            hintText: 'Contoh: Mobil sedan hitam',
                          ),
                        ),
                        const SizedBox(height: AppSpacing.base),
                        TextFormField(
                          controller: _plateController,
                          enabled: !state.isSubmitting,
                          textCapitalization: TextCapitalization.characters,
                          textInputAction: TextInputAction.next,
                          inputFormatters: [
                            LengthLimitingTextInputFormatter(20),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Nomor polisi (opsional)',
                          ),
                        ),
                        const SizedBox(height: AppSpacing.base),
                        TextFormField(
                          controller: _purposeController,
                          enabled: !state.isSubmitting,
                          textInputAction: TextInputAction.next,
                          inputFormatters: [
                            LengthLimitingTextInputFormatter(200),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Tujuan (opsional)',
                          ),
                        ),
                        const SizedBox(height: AppSpacing.base),
                        TextFormField(
                          controller: _notesController,
                          enabled: !state.isSubmitting,
                          maxLines: 3,
                          inputFormatters: [
                            LengthLimitingTextInputFormatter(1000),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Catatan (opsional)',
                          ),
                        ),
                        if (state.submissionError != null) ...[
                          const SizedBox(height: AppSpacing.md),
                          Semantics(
                            liveRegion: true,
                            child: Text(
                              state.submissionError!.message,
                              style: AppTypography.body.copyWith(
                                color: AppColors.danger,
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: AppSpacing.lg),
                        AppButton(
                          label: 'Kirim undangan',
                          onPressed: state.isSubmitting ? null : _submit,
                          isLoading: state.isSubmitting,
                        ),
                      ],
                    ),
                  ),
                  if (state.lastInvite != null) ...[
                    const SizedBox(height: AppSpacing.lg),
                    _QrRevealCard(visitor: state.lastInvite!),
                  ],
                  const SizedBox(height: AppSpacing.xl),
                  ],
                  AppSectionHeader(
                    title: canCheckin ? 'Daftar tamu' : 'Undangan tamu kamu',
                  ),
                  _VisitorInviteList(canCheckin: canCheckin),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _QrRevealCard extends StatelessWidget {
  const _QrRevealCard({required this.visitor});

  final Visitor visitor;

  @override
  Widget build(BuildContext context) {
    final qrToken = visitor.qrToken;
    if (qrToken == null) return const SizedBox.shrink();
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          color: AppColors.surfaceSoft,
          borderRadius: BorderRadius.circular(AppRadius.medium),
          border: Border.all(color: AppColors.borderStrong),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Kode QR untuk ${visitor.guestName}',
              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            SelectableText(
              qrToken,
              style: AppTypography.tabular(
                AppTypography.title,
              ).copyWith(color: AppColors.primaryDark),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Tunjukkan kode ini ke petugas keamanan saat tamu tiba.',
              style: AppTypography.caption,
            ),
          ],
        ),
      ),
    );
  }
}

class _VisitorInviteList extends ConsumerWidget {
  const _VisitorInviteList({required this.canCheckin});

  final bool canCheckin;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitors = ref.watch(visitorListProvider);

    return visitors.when(
      loading: () => const _VisitorListSkeleton(),
      error: (error, _) {
        final failure = error is ApiException
            ? error
            : ApiException.malformedResponse();
        return SizedBox(
          height: 220,
          child: StatePanel(
            icon: failure.isForbidden
                ? Icons.block_outlined
                : Icons.cloud_off_outlined,
            title: failure.isForbidden
                ? 'Daftar undangan tidak dapat diakses'
                : 'Daftar undangan belum bisa dimuat',
            message: failure.message,
            actionLabel: failure.isForbidden ? null : 'Coba lagi',
            onAction: failure.isForbidden
                ? null
                : () => ref.invalidate(visitorListProvider),
          ),
        );
      },
      data: (items) {
        if (items.isEmpty) {
          return const SizedBox(
            height: 160,
            child: StatePanel(
              icon: Icons.people_outline,
              title: 'Belum ada undangan tamu',
              message: 'Tamu yang kamu undang akan muncul di sini.',
            ),
          );
        }
        return Column(
          children: [
            for (final visitor in items) ...[
              _VisitorRow(visitor: visitor, canCheckin: canCheckin),
              const SizedBox(height: AppSpacing.sm),
            ],
          ],
        );
      },
    );
  }
}

class _VisitorRow extends ConsumerStatefulWidget {
  const _VisitorRow({required this.visitor, required this.canCheckin});

  final Visitor visitor;
  final bool canCheckin;

  @override
  ConsumerState<_VisitorRow> createState() => _VisitorRowState();
}

class _VisitorRowState extends ConsumerState<_VisitorRow> {
  bool _isCheckingOut = false;
  String? _error;

  Future<void> _checkOut() async {
    setState(() {
      _isCheckingOut = true;
      _error = null;
    });
    try {
      await ref.read(visitorRepositoryProvider).checkOut(widget.visitor.id);
      ref.invalidate(visitorListProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isCheckingOut = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final visitor = widget.visitor;
    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  visitor.guestName,
                  style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  '${visitor.houseCode} · '
                  '${_formatVisitDateLabel(visitor.visitDate)}'
                  '${visitor.isWalkIn ? ' · Walk-in' : ''}',
                  style: AppTypography.caption,
                ),
                if (_error != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    _error!,
                    style: AppTypography.caption.copyWith(color: AppColors.danger),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              AppBadge(
                label: _statusLabels[visitor.status]!,
                tone: _statusTone(visitor.status),
              ),
              if (widget.canCheckin &&
                  visitor.status == VisitorStatus.checkedIn) ...[
                const SizedBox(height: AppSpacing.sm),
                OutlinedButton(
                  onPressed: _isCheckingOut ? null : _checkOut,
                  style: OutlinedButton.styleFrom(
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                    textStyle: AppTypography.caption,
                  ),
                  child: _isCheckingOut
                      ? const SizedBox(
                          height: 14,
                          width: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Check-out'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _VisitorListSkeleton extends StatelessWidget {
  const _VisitorListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat daftar undangan tamu',
      liveRegion: true,
      child: Column(
        children: List.generate(
          2,
          (index) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: ExcludeSemantics(
              child: Container(
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Security-facing check-in tools, mirroring `visitor-checkin-panel.tsx`'s
/// `VisitorLookupCard` + `VisitorWalkInForm`.
class _VisitorCheckinSection extends ConsumerStatefulWidget {
  const _VisitorCheckinSection();

  @override
  ConsumerState<_VisitorCheckinSection> createState() =>
      _VisitorCheckinSectionState();
}

class _VisitorCheckinSectionState
    extends ConsumerState<_VisitorCheckinSection> {
  final _tokenController = TextEditingController();
  bool _isLookingUp = false;
  bool _isCheckingIn = false;
  String? _lookupError;
  Visitor? _foundVisitor;
  bool _searched = false;

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _lookup() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) return;
    setState(() {
      _isLookingUp = true;
      _lookupError = null;
      _foundVisitor = null;
      _searched = false;
    });
    try {
      final visitor =
          await ref.read(visitorRepositoryProvider).lookupByQrToken(token);
      if (mounted) {
        setState(() {
          _foundVisitor = visitor;
          _searched = true;
        });
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _lookupError = error.message);
    } finally {
      if (mounted) setState(() => _isLookingUp = false);
    }
  }

  Future<void> _checkIn() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) return;
    setState(() {
      _isCheckingIn = true;
      _lookupError = null;
    });
    try {
      final visitor = await ref.read(visitorRepositoryProvider).checkIn(token);
      if (mounted) setState(() => _foundVisitor = visitor);
      ref.invalidate(visitorListProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _lookupError = error.message);
    } finally {
      if (mounted) setState(() => _isCheckingIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final visitor = _foundVisitor;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Cari kode QR tamu', style: AppTypography.title),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _tokenController,
                      decoration: const InputDecoration(
                        isDense: true,
                        labelText: 'Kode QR',
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  AppButton(
                    label: 'Cari',
                    onPressed: _isLookingUp ? null : _lookup,
                    isLoading: _isLookingUp,
                    expand: false,
                  ),
                ],
              ),
              if (_lookupError != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  _lookupError!,
                  style: AppTypography.body.copyWith(color: AppColors.danger),
                ),
              ],
              if (_searched && visitor == null && _lookupError == null) ...[
                const SizedBox(height: AppSpacing.sm),
                Text('Kode tidak ditemukan.', style: AppTypography.body),
              ],
              if (visitor != null) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(AppRadius.medium),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              visitor.guestName,
                              style: AppTypography.bodyLarge.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${visitor.houseCode} · '
                              '${_formatVisitDateLabel(visitor.visitDate)}',
                              style: AppTypography.caption,
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            AppBadge(
                              label: _statusLabels[visitor.status]!,
                              tone: _statusTone(visitor.status),
                            ),
                          ],
                        ),
                      ),
                      if (visitor.status == VisitorStatus.pending)
                        AppButton(
                          label: 'Check-in',
                          onPressed: _isCheckingIn ? null : _checkIn,
                          isLoading: _isCheckingIn,
                          expand: false,
                        ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.base),
        const _VisitorWalkInForm(),
      ],
    );
  }
}

class _VisitorWalkInForm extends ConsumerStatefulWidget {
  const _VisitorWalkInForm();

  @override
  ConsumerState<_VisitorWalkInForm> createState() => _VisitorWalkInFormState();
}

class _VisitorWalkInFormState extends ConsumerState<_VisitorWalkInForm> {
  final _formKey = GlobalKey<FormState>();
  final _houseCodeController = TextEditingController();
  final _guestNameController = TextEditingController();
  final _guestPhoneController = TextEditingController();
  final _vehicleInfoController = TextEditingController();
  final _plateController = TextEditingController();
  final _purposeController = TextEditingController();
  bool _isSaving = false;
  String? _error;
  String? _successGuestName;

  @override
  void dispose() {
    _houseCodeController.dispose();
    _guestNameController.dispose();
    _guestPhoneController.dispose();
    _vehicleInfoController.dispose();
    _plateController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isSaving = true;
      _error = null;
      _successGuestName = null;
    });
    try {
      final visitor = await ref.read(visitorRepositoryProvider).createWalkIn(
            houseCode: _houseCodeController.text.trim(),
            guestName: _guestNameController.text.trim(),
            guestPhone: _guestPhoneController.text.trim(),
            vehicleInfo: _vehicleInfoController.text.trim(),
            plate: _plateController.text.trim(),
            purpose: _purposeController.text.trim(),
          );
      _houseCodeController.clear();
      _guestNameController.clear();
      _guestPhoneController.clear();
      _vehicleInfoController.clear();
      _plateController.clear();
      _purposeController.clear();
      ref.invalidate(visitorListProvider);
      if (mounted) setState(() => _successGuestName = visitor.guestName);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Catat tamu walk-in', style: AppTypography.title),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _houseCodeController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Kode rumah'),
              validator: (value) => (value ?? '').trim().isEmpty
                  ? 'Masukkan kode rumah yang dituju.'
                  : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _guestNameController,
              decoration: const InputDecoration(labelText: 'Nama tamu'),
              validator: (value) => (value ?? '').trim().length < 2
                  ? 'Masukkan nama tamu, minimal 2 karakter.'
                  : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _guestPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Nomor HP tamu (opsional)',
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _vehicleInfoController,
              decoration: const InputDecoration(
                labelText: 'Kendaraan (opsional)',
                hintText: 'Contoh: Mobil sedan hitam',
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _plateController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Nomor polisi (opsional)',
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _purposeController,
              decoration: const InputDecoration(labelText: 'Tujuan (opsional)'),
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(_error!, style: AppTypography.body.copyWith(color: AppColors.danger)),
            ],
            if (_successGuestName != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                '$_successGuestName berhasil dicatat dan sudah check-in.',
                style: AppTypography.body.copyWith(color: AppColors.success),
              ),
            ],
            const SizedBox(height: AppSpacing.base),
            AppButton(
              label: 'Catat & check-in tamu',
              onPressed: _isSaving ? null : _submit,
              isLoading: _isSaving,
            ),
          ],
        ),
      ),
    );
  }
}
