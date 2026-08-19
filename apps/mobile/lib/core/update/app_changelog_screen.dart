import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/update/app_update_service.dart';

/// Full-page release notes for an offered update, reached from
/// [AppUpdateDialog]'s "Lihat catatan perubahan lengkap" link. Pushed with a
/// plain [Navigator] rather than a GoRouter path — it is tied to one
/// in-memory [AppRelease] the dialog already has, not a deep-linkable
/// destination.
class AppChangelogScreen extends StatelessWidget {
  const AppChangelogScreen({super.key, required this.release});

  final AppRelease release;

  @override
  Widget build(BuildContext context) {
    final notes = release.releaseNotes?.trim() ?? '';
    final points = notes
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          release.versionName == null
              ? 'Catatan Pembaruan'
              : 'Catatan Pembaruan · ${release.versionName}',
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          children: [
            if (release.mandatory) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.danger.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.priority_high,
                      size: 16,
                      color: AppColors.danger,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Pembaruan wajib',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.danger,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            if (points.isEmpty)
              Text(
                'Belum ada catatan perubahan rinci untuk versi ini.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              )
            else
              for (final point in points) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 2),
                      child: Icon(
                        Icons.circle,
                        size: 6,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        point,
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(height: 1.4),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
              ],
          ],
        ),
      ),
    );
  }
}
