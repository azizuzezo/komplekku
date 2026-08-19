import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/entity_actions.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/agenda/data/agenda_repository.dart';
import 'package:komplekku/features/agenda/domain/agenda_event.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

class AgendaListScreen extends ConsumerStatefulWidget {
  const AgendaListScreen({super.key});

  @override
  ConsumerState<AgendaListScreen> createState() => _AgendaListScreenState();
}

class _AgendaListScreenState extends ConsumerState<AgendaListScreen> {
  AgendaView _view = AgendaView.upcoming;

  Future<void> _editEvent(AgendaEvent event) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => _CreateAgendaDialog(existing: event),
    );
    if (saved == true) ref.invalidate(agendaListProvider(_view));
  }

  Future<void> _archiveEvent(AgendaEvent event) async {
    try {
      await ref.read(agendaRepositoryProvider).archive(event.id);
      ref.invalidate(agendaListProvider(_view));
      ref.invalidate(agendaByDateProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Agenda berhasil dihapus.')),
        );
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Agenda belum dapat dihapus. Coba lagi.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final agenda = ref.watch(agendaListProvider(_view));
    final permissions = ref.watch(currentPermissionsProvider);
    final canManage = permissions.contains('agenda.manage');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda'),
        actions: [
          IconButton(
            tooltip: 'Tampilan kalender',
            icon: const Icon(Icons.calendar_month_outlined),
            onPressed: () => context.push('/kalender'),
          ),
        ],
      ),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              onPressed: () async {
                final created = await showDialog<bool>(
                  context: context,
                  builder: (context) => const _CreateAgendaDialog(),
                );
                if (created == true) {
                  ref.invalidate(agendaListProvider(_view));
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Buat Agenda'),
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            )
          : null,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.base,
                AppSpacing.md,
                AppSpacing.base,
                0,
              ),
              child: SegmentedButton<AgendaView>(
                segments: const [
                  ButtonSegment(
                    value: AgendaView.upcoming,
                    label: Text('Mendatang'),
                  ),
                  ButtonSegment(value: AgendaView.past, label: Text('Lampau')),
                ],
                selected: {_view},
                onSelectionChanged: (selection) {
                  setState(() => _view = selection.first);
                },
              ),
            ),
            Expanded(
              child: agenda.when(
                loading: () => const _AgendaListSkeleton(),
                error: (error, _) {
                  final failure = error is ApiException
                      ? error
                      : ApiException.malformedResponse();
                  if (failure.isUnauthorized) {
                    return StatePanel(
                      icon: Icons.lock_outline,
                      title: 'Sesi sudah berakhir',
                      message: 'Masuk kembali untuk melihat agenda.',
                      actionLabel: 'Keluar',
                      onAction: () => ref
                          .read(sessionControllerProvider.notifier)
                          .signOut(),
                    );
                  }
                  return StatePanel(
                    icon: failure.isForbidden
                        ? Icons.block_outlined
                        : Icons.cloud_off_outlined,
                    title: failure.isForbidden
                        ? 'Agenda belum dapat diakses'
                        : 'Agenda belum bisa dimuat',
                    message: failure.message,
                    actionLabel: failure.isForbidden ? null : 'Coba lagi',
                    onAction: failure.isForbidden
                        ? null
                        : () => ref.invalidate(agendaListProvider(_view)),
                  );
                },
                data: (items) {
                  if (items.isEmpty) {
                    return StatePanel(
                      icon: Icons.event_outlined,
                      title: _view == AgendaView.upcoming
                          ? 'Belum ada agenda mendatang'
                          : 'Belum ada agenda lampau',
                      message: _view == AgendaView.upcoming
                          ? 'Kegiatan yang diterbitkan pengurus akan muncul di sini.'
                          : 'Riwayat kegiatan lingkungan akan muncul di sini.',
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.refresh(agendaListProvider(_view).future),
                    child: ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.base,
                        AppSpacing.md,
                        AppSpacing.base,
                        AppSpacing.xl,
                      ),
                      itemCount: items.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, index) {
                        final event = items[index];
                        return _AgendaCard(
                          event: event,
                          canManage: canManage,
                          onTap: () => context.push('/agenda/${event.id}'),
                          onEdit: () => _editEvent(event),
                          onDelete: () => _archiveEvent(event),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Create and edit share one dialog: editing pre-fills it from the event and
/// switches the call, so validation never drifts between the two.
class _CreateAgendaDialog extends ConsumerStatefulWidget {
  const _CreateAgendaDialog({this.existing});

  final AgendaEvent? existing;

  @override
  ConsumerState<_CreateAgendaDialog> createState() =>
      __CreateAgendaDialogState();
}

class __CreateAgendaDialogState extends ConsumerState<_CreateAgendaDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _organizerController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime? _date;
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  bool _submitting = false;
  String? _errorMessage;

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    if (existing == null) return;
    _titleController.text = existing.title;
    _locationController.text = existing.location;
    _organizerController.text = existing.organizer;
    _descriptionController.text = existing.description;
    _date = DateTime.tryParse(existing.date);
    _startTime = _parseTimeOfDay(existing.startTime);
    _endTime = _parseTimeOfDay(existing.endTime);
  }

  /// Parses the API's `HH:mm` wall-clock strings.
  TimeOfDay? _parseTimeOfDay(String value) {
    final parts = value.split(':');
    if (parts.length != 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    return TimeOfDay(hour: hour, minute: minute);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _organizerController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  String _twoDigits(int value) => value.toString().padLeft(2, '0');

  String _formatDate(DateTime date) =>
      '${date.year}-${_twoDigits(date.month)}-${_twoDigits(date.day)}';

  String _formatTime(TimeOfDay time) =>
      '${_twoDigits(time.hour)}:${_twoDigits(time.minute)}';

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime({required bool isStart}) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: (isStart ? _startTime : _endTime) ?? TimeOfDay.now(),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startTime = picked;
      } else {
        _endTime = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final date = _date;
    final startTime = _startTime;
    final endTime = _endTime;
    if (date == null || startTime == null || endTime == null) {
      setState(() => _errorMessage = 'Lengkapi tanggal dan waktu kegiatan.');
      return;
    }
    if (_formatTime(endTime).compareTo(_formatTime(startTime)) <= 0) {
      setState(
        () => _errorMessage = 'Waktu selesai harus setelah waktu mulai.',
      );
      return;
    }
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      final repository = ref.read(agendaRepositoryProvider);
      final existing = widget.existing;
      if (existing != null) {
        await repository.update(
          id: existing.id,
          title: _titleController.text.trim(),
          date: _formatDate(date),
          startTime: _formatTime(startTime),
          endTime: _formatTime(endTime),
          location: _locationController.text.trim(),
          organizer: _organizerController.text.trim(),
          description: _descriptionController.text.trim(),
        );
      } else {
        await repository.create(
          title: _titleController.text.trim(),
          date: _formatDate(date),
          startTime: _formatTime(startTime),
          endTime: _formatTime(endTime),
          location: _locationController.text.trim(),
          organizer: _organizerController.text.trim(),
          description: _descriptionController.text.trim(),
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _errorMessage = error is ApiException
              ? error.message
              : 'Gagal menyimpan agenda.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.modal),
      ),
      title: Text(
        _isEditing ? 'Edit Agenda' : 'Buat Agenda Baru',
        style: AppTypography.title,
      ),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: Text(
                    _errorMessage!,
                    style: AppTypography.body.copyWith(color: AppColors.danger),
                  ),
                ),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Judul Agenda',
                  hintText: 'Misal: Kerja Bakti Hari Minggu',
                ),
                validator: (val) => val == null || val.trim().length < 3
                    ? 'Judul minimal 3 karakter'
                    : null,
              ),
              const SizedBox(height: AppSpacing.md),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  _date == null ? 'Pilih tanggal' : _formatDate(_date!),
                ),
                trailing: const Icon(Icons.calendar_today_outlined),
                onTap: _pickDate,
              ),
              Row(
                children: [
                  Expanded(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        _startTime == null ? 'Mulai' : _formatTime(_startTime!),
                      ),
                      trailing: const Icon(Icons.schedule_outlined),
                      onTap: () => _pickTime(isStart: true),
                    ),
                  ),
                  Expanded(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        _endTime == null ? 'Selesai' : _formatTime(_endTime!),
                      ),
                      trailing: const Icon(Icons.schedule_outlined),
                      onTap: () => _pickTime(isStart: false),
                    ),
                  ),
                ],
              ),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Lokasi',
                  hintText: 'Misal: Balai Warga',
                ),
                validator: (val) => val == null || val.trim().length < 2
                    ? 'Lokasi minimal 2 karakter'
                    : null,
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _organizerController,
                decoration: const InputDecoration(
                  labelText: 'Penyelenggara',
                  hintText: 'Misal: Pengurus RT',
                ),
                validator: (val) => val == null || val.trim().length < 2
                    ? 'Penyelenggara minimal 2 karakter'
                    : null,
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Deskripsi',
                  hintText: 'Tuliskan detail kegiatan...',
                ),
                validator: (val) => val == null || val.trim().length < 3
                    ? 'Deskripsi minimal 3 karakter'
                    : null,
              ),
            ],
          ),
        ),
      ),
      actions: [
        AppButton(
          label: 'Batal',
          variant: AppButtonVariant.ghost,
          expand: false,
          onPressed: _submitting
              ? null
              : () => Navigator.of(context).pop(false),
        ),
        AppButton(
          label: _isEditing ? 'Simpan Perubahan' : 'Terbitkan',
          variant: AppButtonVariant.primary,
          expand: false,
          isLoading: _submitting,
          onPressed: _submitting ? null : _submit,
        ),
      ],
    );
  }
}

class _AgendaCard extends StatelessWidget {
  const _AgendaCard({
    required this.event,
    required this.canManage,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  final AgendaEvent event;
  final bool canManage;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final Future<void> Function() onDelete;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(AppRadius.small),
            ),
            child: const Icon(Icons.event_outlined, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  '${event.dateLabel} · ${event.timeRangeLabel}',
                  style: AppTypography.tabular(AppTypography.body),
                ),
                const SizedBox(height: 2),
                Text(event.location, style: AppTypography.caption),
              ],
            ),
          ),
          if (canManage)
            EntityActions(
              onEdit: onEdit,
              onDelete: onDelete,
              deleteTitle: 'Hapus agenda?',
              deleteMessage:
                  '"${event.title}" tidak akan terlihat lagi di kalender warga.',
              tooltip: 'Kelola agenda',
            ),
        ],
      ),
    );
  }
}

class _AgendaListSkeleton extends StatelessWidget {
  const _AgendaListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat agenda',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.base),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 96,
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
            ),
          ),
        ),
      ),
    );
  }
}
