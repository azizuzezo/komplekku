import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/visitor/data/visitor_repository.dart';
import 'package:komplekku/features/visitor/domain/visitor.dart';
import 'package:komplekku/features/visitor/presentation/visitor_controller.dart';

const _statusLabels = {
  VisitorStatus.pending: 'Menunggu kedatangan',
  VisitorStatus.checkedIn: 'Sudah check-in',
  VisitorStatus.checkedOut: 'Sudah check-out',
  VisitorStatus.cancelled: 'Dibatalkan',
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

/// Resident-facing "Tamu" screen. Mirrors
/// `apps/web/features/visitor/visitor-invite-panel.tsx`: an inline invite
/// form (guest name, visit date, optional details) that reveals the guest's
/// QR token on success, plus a list of the resident's own past invitations.
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

    return Scaffold(
      appBar: AppBar(title: const Text('Tamu')),
      body: SafeArea(
        child: inviteState.when(
          loading: () => const Center(child: CircularProgressIndicator()),
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
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Undang tamu dan bagikan kode QR yang ditunjukkan ke '
                    'petugas keamanan saat mereka tiba.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
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
                        const SizedBox(height: 16),
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
                        const SizedBox(height: 16),
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
                        const SizedBox(height: 16),
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
                        const SizedBox(height: 16),
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
                        const SizedBox(height: 16),
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
                        const SizedBox(height: 16),
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
                          const SizedBox(height: 14),
                          Semantics(
                            liveRegion: true,
                            child: Text(
                              state.submissionError!.message,
                              style: const TextStyle(
                                color: KomplekkuColors.danger,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: state.isSubmitting ? null : _submit,
                          child: Text(
                            state.isSubmitting
                                ? 'Mengirim undangan…'
                                : 'Kirim undangan',
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (state.lastInvite != null) ...[
                    const SizedBox(height: 20),
                    _QrRevealCard(visitor: state.lastInvite!),
                  ],
                  const SizedBox(height: 28),
                  Text(
                    'Undangan tamu kamu',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  const _VisitorInviteList(),
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
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: KomplekkuColors.surfaceSoft,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: KomplekkuColors.borderStrong),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Kode QR untuk ${visitor.guestName}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            SelectableText(
              qrToken,
              style: const TextStyle(
                fontFeatures: [FontFeature.tabularFigures()],
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Tunjukkan kode ini ke petugas keamanan saat tamu tiba.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _VisitorInviteList extends ConsumerWidget {
  const _VisitorInviteList();

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
              _VisitorRow(visitor: visitor),
              const SizedBox(height: 10),
            ],
          ],
        );
      },
    );
  }
}

class _VisitorRow extends StatelessWidget {
  const _VisitorRow({required this.visitor});

  final Visitor visitor;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    visitor.guestName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatVisitDateLabel(visitor.visitDate) +
                        (visitor.isWalkIn ? ' · Walk-in' : ''),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Text(
              _statusLabels[visitor.status]!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KomplekkuColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ],
        ),
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
            padding: const EdgeInsets.only(bottom: 10),
            child: ExcludeSemantics(
              child: Container(
                height: 72,
                decoration: BoxDecoration(
                  color: KomplekkuColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
