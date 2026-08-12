import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/camera/data/camera_repository.dart';
import 'package:komplekku/features/camera/domain/camera.dart';

/// Resident-facing CCTV list. Mirrors `apps/web/features/camera/camera-list.tsx`:
/// the whole page is an explicitly simulated (mock) feed, never a real
/// RTSP stream, and each camera row can be expanded in place to reveal a
/// simulated viewer frame plus the mock stream ticket/watermark details.
class CameraListScreen extends ConsumerWidget {
  const CameraListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cameras = ref.watch(cameraListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('CCTV')),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: KomplekkuColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: KomplekkuColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.info_outline,
                      size: 18,
                      color: KomplekkuColors.textSecondary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Tayangan pada halaman ini bersifat simulasi (mode mock), '
                        'belum menampilkan aliran video sungguhan.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: cameras.when(
                loading: () => const _CameraListSkeleton(),
                error: (error, _) {
                  final failure = error is ApiException
                      ? error
                      : ApiException.malformedResponse();
                  if (failure.isUnauthorized) {
                    return StatePanel(
                      icon: Icons.lock_outline,
                      title: 'Sesi sudah berakhir',
                      message: 'Masuk kembali untuk melihat kamera lingkungan.',
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
                        ? 'Kamera belum dapat diakses'
                        : 'Kamera belum bisa dimuat',
                    message: failure.message,
                    actionLabel: failure.isForbidden ? null : 'Coba lagi',
                    onAction: failure.isForbidden
                        ? null
                        : () => ref.invalidate(cameraListProvider),
                  );
                },
                data: (items) {
                  if (items.isEmpty) {
                    return const StatePanel(
                      icon: Icons.videocam_off_outlined,
                      title: 'Belum ada kamera',
                      message: 'Kamera yang dapat kamu akses akan muncul di sini.',
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () => ref.refresh(cameraListProvider.future),
                    child: ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: items.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) =>
                          _CameraCard(camera: items[index]),
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

const _accessLevelLabels = {
  CameraAccessLevel.resident: 'Warga',
  CameraAccessLevel.security: 'Keamanan',
  CameraAccessLevel.adminOnly: 'Khusus pengurus',
};

const _statusLabels = {
  CameraStatus.online: 'Online',
  CameraStatus.offline: 'Offline',
};

class _CameraCard extends ConsumerStatefulWidget {
  const _CameraCard({required this.camera});

  final Camera camera;

  @override
  ConsumerState<_CameraCard> createState() => _CameraCardState();
}

class _CameraCardState extends ConsumerState<_CameraCard> {
  bool _isOpen = false;

  @override
  Widget build(BuildContext context) {
    final camera = widget.camera;
    return Card(
      clipBehavior: Clip.antiAlias,
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
                        camera.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      if (camera.location != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          camera.location!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _StatusBadge(status: camera.status),
                    const SizedBox(height: 6),
                    Text(
                      _accessLevelLabels[camera.accessLevel]!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton(
                onPressed: () => setState(() => _isOpen = !_isOpen),
                child: Text(_isOpen ? 'Tutup' : 'Lihat'),
              ),
            ),
            if (_isOpen) ...[
              const SizedBox(height: 12),
              _CameraViewer(cameraId: camera.id),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final CameraStatus status;

  @override
  Widget build(BuildContext context) {
    final isOnline = status == CameraStatus.online;
    final color = isOnline ? KomplekkuColors.success : KomplekkuColors.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        _statusLabels[status]!,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _CameraViewer extends ConsumerWidget {
  const _CameraViewer({required this.cameraId});

  final String cameraId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticket = ref.watch(cameraStreamTicketProvider(cameraId));
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: KomplekkuColors.surfaceSoft,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: KomplekkuColors.border),
      ),
      child: ticket.when(
        loading: () => const Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 10),
            Text('Menyiapkan tontonan simulasi…'),
          ],
        ),
        error: (error, _) {
          final failure = error is ApiException
              ? error
              : ApiException.malformedResponse();
          return Text(
            failure.message,
            style: const TextStyle(color: KomplekkuColors.danger),
          );
        },
        data: (data) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                height: 96,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: KomplekkuColors.primaryDark,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.videocam_outlined,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Tayangan simulasi (mode mock)',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              _Fact(label: 'Tiket mock', value: data.ticket ?? 'Tidak tersedia'),
              _Fact(label: 'Ditonton oleh', value: data.watermark.viewerName),
              _Fact(label: 'Label', value: data.watermark.label),
              const SizedBox(height: 8),
              Text(
                'Belum ada aliran video sungguhan — kartu ini hanya mensimulasikan '
                'tontonan kamera.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            TextSpan(text: value),
          ],
        ),
        style: Theme.of(context).textTheme.bodySmall,
      ),
    );
  }
}

class _CameraListSkeleton extends StatelessWidget {
  const _CameraListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat kamera',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 96,
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
