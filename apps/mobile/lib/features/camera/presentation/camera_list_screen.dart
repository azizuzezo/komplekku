import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/camera/data/camera_repository.dart';
import 'package:komplekku/features/camera/domain/camera.dart';
import 'package:komplekku/shared/widgets/app_badge.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

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
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.base,
                AppSpacing.md,
                AppSpacing.base,
                AppSpacing.xs,
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(AppRadius.small),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.info_outline,
                      size: 18,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'Tayangan pada halaman ini bersifat simulasi (mode mock), '
                        'belum menampilkan aliran video sungguhan.',
                        style: AppTypography.caption,
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
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.base,
                        AppSpacing.md,
                        AppSpacing.base,
                        AppSpacing.xl,
                      ),
                      itemCount: items.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: AppSpacing.sm),
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
    return AppCard(
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
                      style: AppTypography.bodyLarge.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (camera.location != null) ...[
                      const SizedBox(height: 4),
                      Text(camera.location!, style: AppTypography.caption),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _StatusBadge(status: camera.status),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    _accessLevelLabels[camera.accessLevel]!,
                    style: AppTypography.caption,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Align(
            alignment: Alignment.centerRight,
            child: AppButton(
              label: _isOpen ? 'Tutup' : 'Lihat',
              variant: AppButtonVariant.secondary,
              expand: false,
              onPressed: () => setState(() => _isOpen = !_isOpen),
            ),
          ),
          if (_isOpen) ...[
            const SizedBox(height: AppSpacing.md),
            _CameraViewer(cameraId: camera.id),
          ],
        ],
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
    return AppBadge(
      label: _statusLabels[status]!,
      tone: isOnline ? AppBadgeTone.success : AppBadgeTone.neutral,
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
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(color: AppColors.border),
      ),
      child: ticket.when(
        loading: () => Row(
          children: [
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: AppSpacing.sm),
            Text('Menyiapkan tontonan simulasi…', style: AppTypography.body),
          ],
        ),
        error: (error, _) {
          final failure = error is ApiException
              ? error
              : ApiException.malformedResponse();
          return Text(
            failure.message,
            style: AppTypography.body.copyWith(color: AppColors.danger),
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
                  color: AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(AppRadius.small),
                ),
                child: const Icon(
                  Icons.videocam_outlined,
                  color: AppColors.surface,
                  size: 28,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Tayangan simulasi (mode mock)',
                style: AppTypography.bodyLarge.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              _Fact(label: 'Tiket mock', value: data.ticket ?? 'Tidak tersedia'),
              _Fact(label: 'Ditonton oleh', value: data.watermark.viewerName),
              _Fact(label: 'Label', value: data.watermark.label),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Belum ada aliran video sungguhan — kartu ini hanya mensimulasikan '
                'tontonan kamera.',
                style: AppTypography.caption,
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
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            TextSpan(text: value),
          ],
        ),
        style: AppTypography.caption,
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
        padding: const EdgeInsets.all(AppSpacing.base),
        itemCount: 4,
        separatorBuilder: (context, index) =>
            const SizedBox(height: AppSpacing.sm),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 96,
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(AppRadius.small),
            ),
          ),
        ),
      ),
    );
  }
}
