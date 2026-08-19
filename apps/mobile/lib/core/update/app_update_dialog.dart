import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/update/app_changelog_screen.dart';
import 'package:komplekku/core/update/app_update_service.dart';

/// Offers the newer build, enqueues it on Android's own [DownloadManager] so
/// the download survives the screen locking or the app being backgrounded,
/// then hands the finished file to the system installer.
///
/// Android shows its own install confirmation after this — the dialog stops at
/// "Buka pemasang", it cannot install on the user's behalf.
class AppUpdateDialog extends ConsumerStatefulWidget {
  const AppUpdateDialog({super.key, required this.release});

  final AppRelease release;

  @override
  ConsumerState<AppUpdateDialog> createState() => _AppUpdateDialogState();
}

class _AppUpdateDialogState extends ConsumerState<AppUpdateDialog>
    with WidgetsBindingObserver {
  int? _downloadId;
  DownloadStatus? _status;
  bool _installing = false;
  // The download finished while this dialog was not the visible foreground
  // window (screen locked or app backgrounded). Android silently refuses to
  // launch the package installer from a background activity launch in that
  // state, so this stays true until either the app resumes (auto-retried in
  // didChangeAppLifecycleState) or the resident taps "Pasang sekarang"
  // themselves — a real user gesture Android always allows.
  bool _readyToInstall = false;
  String? _installPath;
  String? _error;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _resumeIfAlreadyDownloading();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Only the polling stops here — the DownloadManager request itself keeps
    // running as an Android system service regardless of this dialog's
    // lifecycle, which is the whole point.
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _readyToInstall) {
      _attemptInstall();
    }
  }

  Future<void> _resumeIfAlreadyDownloading() async {
    final service = ref.read(appUpdateServiceProvider);
    final id = await service.pendingDownloadId(widget.release);
    if (id == null || !mounted) return;
    setState(() => _downloadId = id);
    _startPolling(id);
  }

  Future<void> _startUpdate() async {
    if (_readyToInstall) {
      _attemptInstall();
      return;
    }
    setState(() => _error = null);
    final service = ref.read(appUpdateServiceProvider);
    try {
      final id = await service.enqueueDownload(widget.release);
      if (!mounted) return;
      setState(() => _downloadId = id);
      _startPolling(id);
    } on AppUpdateException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  void _startPolling(int id) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(milliseconds: 800), (_) {
      _poll(id);
    });
    _poll(id);
  }

  Future<void> _poll(int id) async {
    final service = ref.read(appUpdateServiceProvider);
    final status = await service.queryDownload(id);
    if (!mounted) return;

    switch (status.state) {
      case DownloadState.successful:
        _pollTimer?.cancel();
        await service.clearPendingDownload();
        final path = status.localPath;
        if (path == null) {
          setState(() {
            _status = status;
            _error = 'Berkas pembaruan tidak ditemukan.';
          });
          return;
        }
        setState(() {
          _status = status;
          _readyToInstall = true;
          _installPath = path;
        });
        _attemptInstall();
      case DownloadState.failed:
        _pollTimer?.cancel();
        await service.clearPendingDownload();
        if (mounted) {
          setState(() {
            _status = status;
            _downloadId = null;
            _error = 'Pembaruan gagal diunduh. Periksa koneksi lalu coba lagi.';
          });
        }
      case DownloadState.pending:
      case DownloadState.running:
      case DownloadState.paused:
      case DownloadState.unknown:
        setState(() => _status = status);
    }
  }

  /// Opens the system installer. Only safe to call while this window is
  /// actually visible — Android refuses the activity launch otherwise, so a
  /// call arriving while backgrounded quietly does nothing and waits for the
  /// resume callback or a manual tap instead of leaving the dialog stuck.
  Future<void> _attemptInstall() async {
    final path = _installPath;
    if (path == null) return;
    if (WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed) {
      return;
    }

    setState(() {
      _installing = true;
      _error = null;
    });
    final service = ref.read(appUpdateServiceProvider);
    try {
      await service.installApk(path);
      if (mounted) Navigator.of(context).pop();
    } on AppUpdateException catch (error) {
      if (mounted) {
        setState(() {
          _installing = false;
          _error = error.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final release = widget.release;
    final isBusy = (_downloadId != null && !_readyToInstall) || _installing;
    final progress = _status?.progress;

    return PopScope(
      // A mandatory update cannot be dismissed with the back gesture either.
      canPop: !release.mandatory && !isBusy && !_readyToInstall,
      child: AlertDialog(
        icon: const Icon(
          Icons.system_update_alt,
          size: 32,
          color: AppColors.primary,
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
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (release.releaseNotes?.trim().isNotEmpty == true) ...[
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(0, 32),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (context) =>
                          AppChangelogScreen(release: release),
                    ),
                  ),
                  child: const Text('Lihat catatan perubahan lengkap'),
                ),
              ),
            ],
            if (isBusy || _readyToInstall) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _installing || _readyToInstall ? null : progress,
                  minHeight: 8,
                  backgroundColor: AppColors.surfaceSoft,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _installing
                    ? 'Membuka pemasang…'
                    : _readyToInstall
                    ? 'Unduhan selesai. Ketuk "Pasang sekarang" untuk memasang.'
                    : progress != null
                    ? 'Mengunduh ${(progress * 100).round()}% — berlanjut walau layar mati.'
                    : 'Menyiapkan unduhan…',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: AppColors.danger),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              'Unduhan berjalan di latar belakang lewat sistem Android, lalu Android menampilkan konfirmasi pemasangan.',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          if (!release.mandatory && !_readyToInstall)
            TextButton(
              onPressed: isBusy ? null : () => Navigator.of(context).pop(),
              child: const Text('Nanti'),
            ),
          FilledButton(
            onPressed: isBusy && !_readyToInstall ? null : _startUpdate,
            child: Text(
              _readyToInstall
                  ? 'Pasang sekarang'
                  : _error == null
                  ? 'Perbarui sekarang'
                  : 'Coba lagi',
            ),
          ),
        ],
      ),
    );
  }
}
