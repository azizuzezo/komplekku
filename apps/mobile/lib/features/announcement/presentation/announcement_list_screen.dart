import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/announcement/data/announcement_repository.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class AnnouncementListScreen extends ConsumerWidget {
  const AnnouncementListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final announcements = ref.watch(announcementListProvider);
    final permissions = ref.watch(currentPermissionsProvider);
    final canManage = permissions.contains('announcement.manage');

    return Scaffold(
      appBar: AppBar(title: const Text('Pengumuman')),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              onPressed: () async {
                final created = await showDialog<bool>(
                  context: context,
                  builder: (context) => const _CreateAnnouncementDialog(),
                );
                if (created == true) {
                  ref.invalidate(announcementListProvider);
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Buat Pengumuman'),
              backgroundColor: KomplekkuColors.primary,
              foregroundColor: Colors.white,
            )
          : null,
      body: SafeArea(
        child: announcements.when(
          loading: () => const _AnnouncementListSkeleton(),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat pengumuman.',
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
                  ? 'Pengumuman belum dapat diakses'
                  : 'Pengumuman belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(announcementListProvider),
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const StatePanel(
                icon: Icons.campaign_outlined,
                title: 'Belum ada pengumuman',
                message:
                    'Informasi lingkungan terbaru akan muncul di sini.',
              );
            }
            return RefreshIndicator(
              onRefresh: () => ref.refresh(announcementListProvider.future),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                itemCount: items.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return _AnnouncementCard(
                    announcement: item,
                    onTap: () => context.push('/aktivitas/pengumuman/${item.id}'),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CreateAnnouncementDialog extends ConsumerStatefulWidget {
  const _CreateAnnouncementDialog();

  @override
  ConsumerState<_CreateAnnouncementDialog> createState() =>
      __CreateAnnouncementDialogState();
}

class __CreateAnnouncementDialogState
    extends ConsumerState<_CreateAnnouncementDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _summaryController = TextEditingController();
  final _bodyController = TextEditingController();
  String _priority = 'NORMAL';
  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      await ref.read(announcementRepositoryProvider).create(
            title: _titleController.text.trim(),
            summary: _summaryController.text.trim(),
            body: _bodyController.text.trim(),
            priority: _priority,
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _errorMessage = error is ApiException
              ? error.message
              : 'Gagal membuat pengumuman.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Buat Pengumuman Baru'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: KomplekkuColors.danger),
                  ),
                ),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Judul Pengumuman',
                  hintText: 'Misal: Kerja Bakti Blok F',
                ),
                validator: (val) =>
                    val == null || val.trim().length < 3 ? 'Judul minimal 3 karakter' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _summaryController,
                decoration: const InputDecoration(
                  labelText: 'Ringkasan Singkat',
                  hintText: 'Ringkasan 1-2 kalimat',
                ),
                validator: (val) =>
                    val == null || val.trim().length < 5 ? 'Ringkasan minimal 5 karakter' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _priority,
                decoration: const InputDecoration(labelText: 'Prioritas'),
                items: const [
                  DropdownMenuItem(value: 'NORMAL', child: Text('Biasa (Normal)')),
                  DropdownMenuItem(value: 'IMPORTANT', child: Text('Penting')),
                  DropdownMenuItem(value: 'URGENT', child: Text('Mendesak (Darurat)')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _priority = val);
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _bodyController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Isi Pengumuman Lengkap',
                  hintText: 'Tuliskan pengumuman secara lengkap...',
                ),
                validator: (val) =>
                    val == null || val.trim().length < 10 ? 'Isi minimal 10 karakter' : null,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.of(context).pop(false),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          onPressed: _submitting ? null : _submit,
          child: Text(_submitting ? 'Menerbitkan...' : 'Terbitkan'),
        ),
      ],
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.announcement, required this.onTap});

  final AnnouncementSummary announcement;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                announcement.isRead
                    ? Icons.mark_email_read_outlined
                    : Icons.campaign_outlined,
                color: KomplekkuColors.primary,
                semanticLabel:
                    announcement.isRead ? 'Sudah dibaca' : 'Belum dibaca',
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (announcement.priority != AnnouncementPriority.normal)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: _PriorityBadge(priority: announcement.priority),
                      ),
                    Text(
                      announcement.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      announcement.summary,
                      style: Theme.of(context).textTheme.bodyMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      formatIndonesianDateTime(announcement.publishedAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: KomplekkuColors.textSecondary,
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PriorityBadge extends StatelessWidget {
  const _PriorityBadge({required this.priority});

  final AnnouncementPriority priority;

  @override
  Widget build(BuildContext context) {
    final isUrgent = priority == AnnouncementPriority.urgent;
    final color = isUrgent ? KomplekkuColors.danger : KomplekkuColors.accent;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        isUrgent ? 'Mendesak' : 'Penting',
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _AnnouncementListSkeleton extends StatelessWidget {
  const _AnnouncementListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat pengumuman',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 110,
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

String formatIndonesianDateTime(DateTime value) {
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
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '${local.day} ${months[local.month - 1]} ${local.year} · $hour:$minute';
}
