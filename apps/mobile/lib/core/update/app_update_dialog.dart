import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/update/app_update_service.dart';

/// Offers the newer build, downloads it with a progress bar, then hands it to
/// the system installer.
///
/// Android shows its own install confirmation after this — the dialog stops at
/// "Buka pemasang", it cannot install on the user's behalf.
class AppUpdateDialog extends ConsumerStatefulWidget {
  const AppUpdateDialog({super.key, required this.release});

  final AppRelease release;

  @override
  ConsumerState<AppUpdateDialog> createState() => _AppUpdateDialogState();
}

class _AppUpdateDialogState extends ConsumerState<AppUpdateDialog> {
  double? _progress;
  bool _installing = false;
  String? _error;

  Future<void> _startUpdate() async {
    setState(() {
      _progress = 0;
      _error = null;
    });
    try {
      final service = ref.read(appUpdateServiceProvider);
      final path = await service.downloadApk(
        widget.release,
        onProgress: (progress) {
          if (mounted) setState(() => _progress = progress);
        },
      );
      if (!mounted) return;
      setState(() => _installing = true);
      await service.installApk(path);
      if (mounted) Navigator.of(context).pop();
    } on AppUpdateException catch (error) {
      if (mounted) {
        setState(() {
          _progress = null;
          _installing = false;
          _error = error.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final release = widget.release;
    final isBusy = _progress != null || _installing;

    return PopScope(
      // A mandatory update cannot be dismissed with the back gesture either.
      canPop: !release.mandatory && !isBusy,
      child: AlertDialog(
        icon: const Icon(
          Icons.system_update_alt,
          size: 32,
          color: KomplekkuColors.primary,
        ),
        title: Text(
          release.versionName == null
              ? 'Pembaruan tersedia'
              : 'Versi ${release.versionName} tersedia',
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              release.releaseNotes?.trim().isNotEmpty == true
                  ? release.releaseNotes!.trim()
                  : 'Versi Komplekku yang lebih baru sudah siap dipasang.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (_progress != null) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _installing ? null : _progress,
                  minHeight: 8,
                  backgroundColor: KomplekkuColors.surfaceSoft,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _installing
                    ? 'Membuka pemasang…'
                    : 'Mengunduh ${(_progress! * 100).round()}%',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: KomplekkuColors.danger),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              'Android akan menampilkan konfirmasi pemasangan setelah unduhan selesai.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: KomplekkuColors.textSecondary,
              ),
            ),
          ],
        ),
        actions: [
          if (!release.mandatory)
            TextButton(
              onPressed: isBusy ? null : () => Navigator.of(context).pop(),
              child: const Text('Nanti'),
            ),
          FilledButton(
            onPressed: isBusy ? null : _startUpdate,
            child: Text(_error == null ? 'Perbarui sekarang' : 'Coba lagi'),
          ),
        ],
      ),
    );
  }
}
