import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/emergency/data/emergency_repository.dart';
import 'package:komplekku/features/emergency/domain/emergency.dart';

const _kindLabels = {
  EmergencyKind.security: 'Keamanan',
  EmergencyKind.medical: 'Medis',
  EmergencyKind.fire: 'Kebakaran',
  EmergencyKind.environmental: 'Lingkungan',
  EmergencyKind.other: 'Lainnya',
};

const _statusLabels = {
  EmergencyStatus.sent: 'Terkirim',
  EmergencyStatus.acknowledged: 'Diterima petugas',
  EmergencyStatus.responding: 'Petugas menuju lokasi',
  EmergencyStatus.resolved: 'Selesai ditangani',
};

const _statusColors = {
  EmergencyStatus.sent: KomplekkuColors.danger,
  EmergencyStatus.acknowledged: KomplekkuColors.accent,
  EmergencyStatus.responding: KomplekkuColors.primary,
  EmergencyStatus.resolved: KomplekkuColors.success,
};

String _twoDigits(int value) => value.toString().padLeft(2, '0');

String _formatSentAt(DateTime value) {
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
  return '${local.day} ${months[local.month - 1]} ${local.year} · '
      '${_twoDigits(local.hour)}:${_twoDigits(local.minute)}';
}

/// Security-side triage console for incoming SOS signals, mirroring
/// `apps/web/features/emergency/emergency-triage-list.tsx`. The Flutter app
/// previously shipped only the resident-side send form, so a petugas on a
/// phone had no way to accept, respond to, or close a signal.
class EmergencyTriageScreen extends ConsumerStatefulWidget {
  const EmergencyTriageScreen({super.key});

  @override
  ConsumerState<EmergencyTriageScreen> createState() =>
      _EmergencyTriageScreenState();
}

class _EmergencyTriageScreenState extends ConsumerState<EmergencyTriageScreen> {
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    // Same 15s cadence as the web console: a signal that lands while the
    // screen is open has to surface without the petugas pulling to refresh.
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) ref.invalidate(emergencyInboxProvider);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canRead = hasPermission(permissions, 'emergency.read');
    final canManage = hasPermission(permissions, 'emergency.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Darurat masuk')),
      body: SafeArea(
        child: !canRead
            ? const StatePanel(
                icon: Icons.block_outlined,
                title: 'Triase darurat tidak dapat diakses',
                message:
                    'Akunmu tidak memiliki izin untuk melihat sinyal darurat warga.',
              )
            : _TriageBody(canManage: canManage),
      ),
    );
  }
}

class _TriageBody extends ConsumerWidget {
  const _TriageBody({required this.canManage});

  final bool canManage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inbox = ref.watch(emergencyInboxProvider);

    return inbox.when(
      loading: () => const _TriageSkeleton(),
      error: (error, _) {
        final failure =
            error is ApiException ? error : ApiException.malformedResponse();
        if (failure.isUnauthorized) {
          return StatePanel(
            icon: Icons.lock_outline,
            title: 'Sesi sudah berakhir',
            message: 'Masuk kembali untuk membuka triase sinyal darurat.',
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
              ? 'Triase darurat tidak dapat diakses'
              : 'Sinyal darurat belum bisa dimuat',
          message: failure.message,
          actionLabel: failure.isForbidden ? null : 'Coba lagi',
          onAction: failure.isForbidden
              ? null
              : () => ref.invalidate(emergencyInboxProvider),
        );
      },
      data: (items) {
        if (items.isEmpty) {
          return RefreshIndicator(
            onRefresh: () => ref.refresh(emergencyInboxProvider.future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 40),
                StatePanel(
                  icon: Icons.notifications_none_outlined,
                  title: 'Belum ada sinyal darurat',
                  message:
                      'Sinyal darurat yang dikirim warga akan muncul di sini.',
                ),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () => ref.refresh(emergencyInboxProvider.future),
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: items.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) => _TriageCard(
              emergency: items[index],
              canManage: canManage,
            ),
          ),
        );
      },
    );
  }
}

class _TriageCard extends ConsumerStatefulWidget {
  const _TriageCard({required this.emergency, required this.canManage});

  final Emergency emergency;
  final bool canManage;

  @override
  ConsumerState<_TriageCard> createState() => _TriageCardState();
}

class _TriageCardState extends ConsumerState<_TriageCard> {
  bool _isMutating = false;
  String? _error;

  Future<void> _run(Future<Emergency> Function(String id) action) async {
    setState(() {
      _isMutating = true;
      _error = null;
    });
    try {
      await action(widget.emergency.id);
      ref.invalidate(emergencyInboxProvider);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = 'Tindakan belum dapat diproses. Silakan coba lagi.',
        );
      }
    } finally {
      if (mounted) setState(() => _isMutating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final emergency = widget.emergency;
    final repository = ref.read(emergencyRepositoryProvider);
    final statusColor = _statusColors[emergency.status]!;
    final isOpen = emergency.status != EmergencyStatus.resolved;
    final note = emergency.note;

    return Card(
      color: emergency.status == EmergencyStatus.sent
          ? KomplekkuColors.danger.withValues(alpha: 0.06)
          : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _kindLabels[emergency.kind]!.toUpperCase(),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.6,
                              color: KomplekkuColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        emergency.houseLabel,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      Text(
                        emergency.senderName,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: statusColor.withValues(alpha: 0.4),
                    ),
                  ),
                  child: Text(
                    _statusLabels[emergency.status]!,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Terkirim: ${_formatSentAt(emergency.sentAt)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (note != null && note.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text('Catatan: $note'),
            ],
            if (_error != null) ...[
              const SizedBox(height: 8),
              Semantics(
                liveRegion: true,
                child: Text(
                  _error!,
                  style: const TextStyle(color: KomplekkuColors.danger),
                ),
              ),
            ],
            if (widget.canManage && isOpen) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  if (emergency.status == EmergencyStatus.sent)
                    _ActionButton(
                      label: 'Terima',
                      busyLabel: 'Menerima…',
                      isBusy: _isMutating,
                      onPressed: () => _run(repository.acknowledge),
                    ),
                  if (emergency.status == EmergencyStatus.acknowledged)
                    _ActionButton(
                      label: 'Tanggapi',
                      busyLabel: 'Menuju lokasi…',
                      isBusy: _isMutating,
                      onPressed: () => _run(repository.respond),
                    ),
                  if (emergency.status == EmergencyStatus.responding)
                    _ActionButton(
                      label: 'Selesaikan',
                      busyLabel: 'Menyelesaikan…',
                      isBusy: _isMutating,
                      isSecondary: true,
                      onPressed: () => _run(repository.resolve),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.busyLabel,
    required this.isBusy,
    required this.onPressed,
    this.isSecondary = false,
  });

  final String label;
  final String busyLabel;
  final bool isBusy;
  final VoidCallback onPressed;
  final bool isSecondary;

  @override
  Widget build(BuildContext context) {
    final child = isBusy
        ? Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                height: 16,
                width: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 8),
              Text(busyLabel),
            ],
          )
        : Text(label);

    if (isSecondary) {
      return OutlinedButton(
        onPressed: isBusy ? null : onPressed,
        child: child,
      );
    }
    return FilledButton(
      onPressed: isBusy ? null : onPressed,
      child: child,
    );
  }
}

class _TriageSkeleton extends StatelessWidget {
  const _TriageSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat sinyal darurat',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 128,
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
