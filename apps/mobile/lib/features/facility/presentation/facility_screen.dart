import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/account/data/account_repository.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/facility/data/facility_repository.dart';
import 'package:komplekku/features/facility/domain/facility.dart';
import 'package:komplekku/features/facility/presentation/facility_booking_controller.dart';

String _dateToApi(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

String _timeToApi(TimeOfDay time) {
  final hour = time.hour.toString().padLeft(2, '0');
  final minute = time.minute.toString().padLeft(2, '0');
  return '$hour:$minute';
}

String _formatDateLabel(DateTime date) {
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
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

/// Resident + staff dual-mode screen for "Fasilitas". Residents pick a
/// facility and date to see the day's schedule and book a free slot
/// (`facility.book`); staff holding `facility.manage` can additionally
/// cancel any resident's booking, not just their own.
class FacilityScreen extends ConsumerStatefulWidget {
  const FacilityScreen({super.key});

  @override
  ConsumerState<FacilityScreen> createState() => _FacilityScreenState();
}

class _FacilityScreenState extends ConsumerState<FacilityScreen> {
  String? _selectedFacilityId;
  DateTime _selectedDate = DateTime.now();
  final _startTimeController = TextEditingController();
  final _endTimeController = TextEditingController();
  final _purposeController = TextEditingController();
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;

  @override
  void dispose() {
    _startTimeController.dispose();
    _endTimeController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _pickTime({required bool isStart}) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startTime = picked;
        _startTimeController.text = _timeToApi(picked);
      } else {
        _endTime = picked;
        _endTimeController.text = _timeToApi(picked);
      }
    });
  }

  Future<void> _submitBooking(String facilityId) async {
    final startTime = _startTime;
    final endTime = _endTime;
    if (startTime == null || endTime == null) return;
    final booking = await ref
        .read(facilityBookingControllerProvider.notifier)
        .submit(
          facilityId: facilityId,
          bookingDate: _dateToApi(_selectedDate),
          startTime: _timeToApi(startTime),
          endTime: _timeToApi(endTime),
          purpose: _purposeController.text,
        );
    if (booking != null && mounted) {
      setState(() {
        _startTime = null;
        _endTime = null;
        _startTimeController.clear();
        _endTimeController.clear();
        _purposeController.clear();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Fasilitas berhasil dipesan.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canBook = hasPermission(permissions, 'facility.book');
    final canManage = hasPermission(permissions, 'facility.manage');
    final facilitiesAsync = ref.watch(facilityListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Fasilitas')),
      body: SafeArea(
        child: facilitiesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat fasilitas.',
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
                  ? 'Fasilitas belum dapat diakses'
                  : 'Fasilitas belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(facilityListProvider),
            );
          },
          data: (facilities) {
            if (facilities.isEmpty) {
              return const StatePanel(
                icon: Icons.villa_outlined,
                title: 'Belum ada fasilitas',
                message: 'Fasilitas yang dapat dipesan akan muncul di sini.',
              );
            }

            final activeFacilityId = _selectedFacilityId ?? facilities.first.id;
            final activeFacility = facilities.firstWhere(
              (facility) => facility.id == activeFacilityId,
              orElse: () => facilities.first,
            );
            final query = (
              facilityId: activeFacilityId,
              date: _dateToApi(_selectedDate),
            );
            final bookingsAsync = ref.watch(facilityBookingListProvider(query));

            return RefreshIndicator(
              onRefresh: () =>
                  ref.refresh(facilityBookingListProvider(query).future),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                children: [
                  Text(
                    'Pilih fasilitas & tanggal',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: activeFacilityId,
                    decoration: const InputDecoration(labelText: 'Fasilitas'),
                    items: facilities
                        .map(
                          (facility) => DropdownMenuItem(
                            value: facility.id,
                            child: Text(facility.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _selectedFacilityId = value),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 6, bottom: 4),
                    child: Text(
                      'Jam operasional ${activeFacility.openTime}–${activeFacility.closeTime}'
                      '${activeFacility.capacity != null ? ' · kapasitas ${activeFacility.capacity} orang' : ''}'
                      '${activeFacility.rules != null ? ' · ${activeFacility.rules}' : ''}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: KomplekkuColors.textSecondary,
                          ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: _pickDate,
                    icon: const Icon(Icons.calendar_today_outlined),
                    label: Text(_formatDateLabel(_selectedDate)),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Jadwal pada tanggal ini',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  bookingsAsync.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: LinearProgressIndicator(),
                    ),
                    error: (error, _) {
                      final failure = error is ApiException
                          ? error
                          : ApiException.malformedResponse();
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          failure.message,
                          style: const TextStyle(color: KomplekkuColors.danger),
                        ),
                      );
                    },
                    data: (bookings) {
                      if (bookings.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Text('Belum ada pemesanan pada tanggal ini.'),
                        );
                      }
                      return Column(
                        children: bookings
                            .map((booking) => _ScheduleRow(booking: booking))
                            .toList(),
                      );
                    },
                  ),
                  if (canBook) ...[
                    const SizedBox(height: 24),
                    Text(
                      'Pesan ${activeFacility.name}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    _BookingForm(
                      startTimeController: _startTimeController,
                      endTimeController: _endTimeController,
                      purposeController: _purposeController,
                      onPickStartTime: () => _pickTime(isStart: true),
                      onPickEndTime: () => _pickTime(isStart: false),
                      onSubmit: () => _submitBooking(activeFacilityId),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Text(
                    'Pemesanan saya',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Consumer(
                    builder: (context, ref, _) {
                      final accountAsync = ref.watch(accountSnapshotProvider);
                      final myDisplayName = accountAsync.value?.displayName;
                      return bookingsAsync.when(
                        loading: () => const SizedBox.shrink(),
                        error: (error, _) => const SizedBox.shrink(),
                        data: (bookings) {
                          final cancellable = bookings
                              .where(
                                (booking) =>
                                    canManage ||
                                    (myDisplayName != null &&
                                        booking.bookedByName == myDisplayName),
                              )
                              .toList();
                          if (cancellable.isEmpty) {
                            return const Text(
                              'Belum ada pemesanan yang dapat dibatalkan.',
                            );
                          }
                          return Column(
                            children: cancellable
                                .map(
                                  (booking) => _CancelRow(
                                    booking: booking,
                                    query: query,
                                  ),
                                )
                                .toList(),
                          );
                        },
                      );
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ScheduleRow extends StatelessWidget {
  const _ScheduleRow({required this.booking});

  final FacilityBooking booking;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${booking.startTime}–${booking.endTime}',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              'Sudah dipesan oleh ${booking.bookedByName} (${booking.houseCode})'
              '${booking.purpose != null ? ' · ${booking.purpose}' : ''}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingForm extends StatelessWidget {
  const _BookingForm({
    required this.startTimeController,
    required this.endTimeController,
    required this.purposeController,
    required this.onPickStartTime,
    required this.onPickEndTime,
    required this.onSubmit,
  });

  final TextEditingController startTimeController;
  final TextEditingController endTimeController;
  final TextEditingController purposeController;
  final VoidCallback onPickStartTime;
  final VoidCallback onPickEndTime;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        final formState = ref.watch(facilityBookingControllerProvider);
        final isSubmitting = formState.value?.isSubmitting ?? false;
        final submissionError = formState.value?.submissionError;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: startTimeController,
              readOnly: true,
              decoration: const InputDecoration(labelText: 'Waktu mulai'),
              onTap: onPickStartTime,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: endTimeController,
              readOnly: true,
              decoration: const InputDecoration(labelText: 'Waktu selesai'),
              onTap: onPickEndTime,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: purposeController,
              decoration: const InputDecoration(
                labelText: 'Keperluan (opsional)',
              ),
            ),
            if (submissionError != null) ...[
              const SizedBox(height: 12),
              Text(
                submissionError.message,
                style: const TextStyle(color: KomplekkuColors.danger),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: isSubmitting ? null : onSubmit,
              child: isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Pesan fasilitas'),
            ),
          ],
        );
      },
    );
  }
}

class _CancelRow extends ConsumerStatefulWidget {
  const _CancelRow({required this.booking, required this.query});

  final FacilityBooking booking;
  final FacilityBookingQuery query;

  @override
  ConsumerState<_CancelRow> createState() => _CancelRowState();
}

class _CancelRowState extends ConsumerState<_CancelRow> {
  bool _isSubmitting = false;
  ApiException? _error;

  Future<void> _cancel() async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await ref
          .read(facilityRepositoryProvider)
          .cancelBooking(widget.booking.id);
      if (!mounted) return;
      ref.invalidate(facilityBookingListProvider(widget.query));
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
    final booking = widget.booking;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${booking.startTime}–${booking.endTime}',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${booking.facilityName} · ${booking.houseCode}'
                    '${booking.purpose != null ? ' · ${booking.purpose}' : ''}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        _error!.message,
                        style: const TextStyle(color: KomplekkuColors.danger),
                      ),
                    ),
                ],
              ),
            ),
            TextButton(
              onPressed: _isSubmitting ? null : _cancel,
              child: _isSubmitting
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Batalkan'),
            ),
          ],
        ),
      ),
    );
  }
}
