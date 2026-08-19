import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/entity_actions.dart';
import 'package:komplekku/core/widgets/prototype_header.dart';
import 'package:komplekku/core/upload/cloudinary_upload.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/announcement/data/announcement_repository.dart';
import 'package:komplekku/features/announcement/domain/announcement.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class AnnouncementListScreen extends ConsumerStatefulWidget {
  const AnnouncementListScreen({super.key});

  @override
  ConsumerState<AnnouncementListScreen> createState() =>
      _AnnouncementListScreenState();
}

class _AnnouncementListScreenState
    extends ConsumerState<AnnouncementListScreen> {
  AnnouncementFilter _filter = AnnouncementFilter.all;

  @override
  Widget build(BuildContext context) {
    final announcements = ref.watch(announcementListProvider(_filter));
    final permissions = ref.watch(currentPermissionsProvider);
    final canManage = permissions.contains('announcement.manage');

    return Scaffold(
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
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 12),
              child: PrototypeHeader(
                title: 'Pengumuman',
                subtitle: 'RT 05 / RW 03 • Billabong',
                showAccount: true,
              ),
            ),
            _FilterChips(
              filter: _filter,
              onChanged: (filter) => setState(() => _filter = filter),
            ),
            Expanded(child: _buildList(context, announcements, canManage)),
          ],
        ),
      ),
    );
  }

  Future<void> _editAnnouncement(AnnouncementSummary announcement) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) =>
          _CreateAnnouncementDialog(existingId: announcement.id),
    );
    if (saved == true) ref.invalidate(announcementListProvider);
  }

  Future<void> _archiveAnnouncement(AnnouncementSummary announcement) async {
    try {
      await ref.read(announcementRepositoryProvider).archive(announcement.id);
      ref.invalidate(announcementListProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pengumuman berhasil dihapus.')),
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
            content: Text('Pengumuman belum dapat dihapus. Coba lagi.'),
          ),
        );
      }
    }
  }

  Widget _buildList(
    BuildContext context,
    AsyncValue<List<AnnouncementSummary>> announcements,
    bool canManage,
  ) {
    return announcements.when(
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
              : () => ref.invalidate(announcementListProvider(_filter)),
        );
      },
      data: (items) {
        if (items.isEmpty) {
          return StatePanel(
            icon: Icons.campaign_outlined,
            title: _filter == AnnouncementFilter.all
                ? 'Belum ada pengumuman'
                : 'Tidak ada yang cocok',
            message: _filter == AnnouncementFilter.all
                ? 'Informasi lingkungan terbaru akan muncul di sini.'
                : 'Coba pilih kategori lain untuk melihat pengumuman lainnya.',
          );
        }
        return RefreshIndicator(
          onRefresh: () =>
              ref.refresh(announcementListProvider(_filter).future),
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
            itemCount: items.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final item = items[index];
              return _AnnouncementCard(
                announcement: item,
                canManage: canManage,
                onTap: () => context.push('/pengumuman/${item.id}'),
                onEdit: () => _editAnnouncement(item),
                onDelete: () => _archiveAnnouncement(item),
              );
            },
          ),
        );
      },
    );
  }
}

const _badgeIcons = {
  AnnouncementBadge.important: Icons.campaign_outlined,
  AnnouncementBadge.event: Icons.event_outlined,
  AnnouncementBadge.info: Icons.info_outline,
};

class _FilterChips extends StatelessWidget {
  const _FilterChips({required this.filter, required this.onChanged});

  final AnnouncementFilter filter;
  final ValueChanged<AnnouncementFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Row(
        children: [
          for (final value in AnnouncementFilter.values)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: ChoiceChip(
                  showCheckmark: value == AnnouncementFilter.all,
                  labelPadding: const EdgeInsets.symmetric(horizontal: 2),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 8,
                  ),
                  label: Text(announcementFilterLabels[value]!),
                  selected: filter == value,
                  onSelected: (_) => onChanged(value),
                  selectedColor: KomplekkuColors.primary,
                  side: BorderSide(
                    color: filter == value
                        ? KomplekkuColors.primary
                        : KomplekkuColors.borderStrong,
                  ),
                  labelStyle: TextStyle(
                    color: filter == value
                        ? Colors.white
                        : KomplekkuColors.textPrimary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _BadgeChip extends StatelessWidget {
  const _BadgeChip({required this.badge});

  final AnnouncementBadge badge;

  @override
  Widget build(BuildContext context) {
    final color = switch (badge) {
      AnnouncementBadge.important => KomplekkuColors.danger,
      AnnouncementBadge.event => KomplekkuColors.primary,
      AnnouncementBadge.info => KomplekkuColors.textSecondary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        announcementBadgeLabels[badge]!,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// The announcement's cover photo, or a category-tinted placeholder when the
/// author did not upload one — so every row keeps the same shape.
class _CoverThumbnail extends StatelessWidget {
  const _CoverThumbnail({required this.url, required this.badge});

  final String? url;
  final AnnouncementBadge badge;

  @override
  Widget build(BuildContext context) {
    final coverUrl = url;
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 72,
        height: 72,
        child: coverUrl == null
            ? ColoredBox(
                color: KomplekkuColors.surfaceMuted,
                child: Center(
                  child: Icon(
                    _badgeIcons[badge],
                    color: KomplekkuColors.primary,
                  ),
                ),
              )
            : Image.network(
                coverUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => ColoredBox(
                  color: KomplekkuColors.surfaceMuted,
                  child: Center(
                    child: Icon(
                      _badgeIcons[badge],
                      color: KomplekkuColors.primary,
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}

/// Create and edit share one dialog: editing loads the current values first
/// and switches the call, so the two never drift apart in validation.
class _CreateAnnouncementDialog extends ConsumerStatefulWidget {
  const _CreateAnnouncementDialog({this.existingId});

  final String? existingId;

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
  AnnouncementCategory _category = AnnouncementCategory.info;
  bool _loadingExisting = false;
  String? _coverImageUrl;
  bool _uploadingCover = false;
  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  bool get _isEditing => widget.existingId != null;

  @override
  void initState() {
    super.initState();
    final existingId = widget.existingId;
    if (existingId == null) return;
    _loadingExisting = true;
    ref
        .read(announcementRepositoryProvider)
        .detail(existingId)
        .then((announcement) {
          if (!mounted) return;
          setState(() {
            _titleController.text = announcement.title;
            _summaryController.text = announcement.summary;
            _bodyController.text = announcement.body;
            _priority = switch (announcement.priority) {
              AnnouncementPriority.urgent => 'URGENT',
              AnnouncementPriority.important => 'IMPORTANT',
              AnnouncementPriority.normal => 'NORMAL',
            };
            _category = announcement.category;
            _coverImageUrl = announcement.coverImageUrl;
            _loadingExisting = false;
          });
        })
        .catchError((Object error) {
          if (!mounted) return;
          setState(() {
            _loadingExisting = false;
            _errorMessage = error is ApiException
                ? error.message
                : 'Pengumuman belum bisa dimuat.';
          });
        });
  }

  Future<void> _pickCover() async {
    if (_uploadingCover) return;
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (picked == null) return;
    setState(() {
      _uploadingCover = true;
      _errorMessage = null;
    });
    try {
      final url = await uploadImageToCloudinary(picked.path);
      if (mounted) setState(() => _coverImageUrl = url);
    } catch (error) {
      if (mounted) {
        setState(() {
          _errorMessage = error is CloudinaryConfigError
              ? error.toString()
              : 'Gambar sampul belum dapat diunggah.';
        });
      }
    } finally {
      if (mounted) setState(() => _uploadingCover = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(announcementRepositoryProvider);
      final existingId = widget.existingId;
      if (existingId != null) {
        await repository.update(
          id: existingId,
          title: _titleController.text.trim(),
          summary: _summaryController.text.trim(),
          body: _bodyController.text.trim(),
          priority: _priority,
          category: _category,
        );
      } else {
        await repository.create(
          title: _titleController.text.trim(),
          summary: _summaryController.text.trim(),
          body: _bodyController.text.trim(),
          priority: _priority,
          category: _category,
          coverImageUrl: _coverImageUrl,
        );
      }
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
      title: Text(_isEditing ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'),
      content: _loadingExisting
          ? const SizedBox(
              height: 80,
              child: Center(child: CircularProgressIndicator()),
            )
          : SingleChildScrollView(
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
                      validator: (val) => val == null || val.trim().length < 3
                          ? 'Judul minimal 3 karakter'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _summaryController,
                      decoration: const InputDecoration(
                        labelText: 'Ringkasan Singkat',
                        hintText: 'Ringkasan 1-2 kalimat',
                      ),
                      validator: (val) => val == null || val.trim().length < 5
                          ? 'Ringkasan minimal 5 karakter'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<AnnouncementCategory>(
                      initialValue: _category,
                      decoration: const InputDecoration(
                        labelText: 'Kategori',
                        helperText:
                            'Menentukan chip Acara/Info di papan pengumuman.',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: AnnouncementCategory.info,
                          child: Text('Info'),
                        ),
                        DropdownMenuItem(
                          value: AnnouncementCategory.event,
                          child: Text('Acara'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _category = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    _CoverPickerField(
                      coverImageUrl: _coverImageUrl,
                      isUploading: _uploadingCover,
                      onPick: _pickCover,
                      onRemove: () => setState(() => _coverImageUrl = null),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _priority,
                      decoration: const InputDecoration(
                        labelText: 'Prioritas',
                        helperText:
                            'Di atas Normal, pengumuman ditandai "Penting".',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'NORMAL',
                          child: Text('Biasa (Normal)'),
                        ),
                        DropdownMenuItem(
                          value: 'IMPORTANT',
                          child: Text('Penting'),
                        ),
                        DropdownMenuItem(
                          value: 'URGENT',
                          child: Text('Mendesak (Darurat)'),
                        ),
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
                      validator: (val) => val == null || val.trim().length < 10
                          ? 'Isi minimal 10 karakter'
                          : null,
                    ),
                  ],
                ),
              ),
            ),
      actions: [
        TextButton(
          onPressed: _submitting
              ? null
              : () => Navigator.of(context).pop(false),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          onPressed: _submitting || _loadingExisting ? null : _submit,
          child: Text(
            _submitting
                ? 'Menyimpan...'
                : _isEditing
                ? 'Simpan Perubahan'
                : 'Terbitkan',
          ),
        ),
      ],
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({
    required this.announcement,
    required this.canManage,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  final AnnouncementSummary announcement;
  final bool canManage;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final Future<void> Function() onDelete;

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
              _CoverThumbnail(
                url: announcement.coverImageUrl,
                badge: announcement.badge,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          _BadgeChip(badge: announcement.badge),
                          if (!announcement.isRead) ...[
                            const SizedBox(width: 6),
                            const Icon(
                              Icons.circle,
                              size: 8,
                              color: KomplekkuColors.primary,
                              semanticLabel: 'Belum dibaca',
                            ),
                          ],
                          const Spacer(),
                          if (canManage)
                            EntityActions(
                              onEdit: onEdit,
                              onDelete: onDelete,
                              deleteTitle: 'Hapus pengumuman?',
                              deleteMessage:
                                  '"${announcement.title}" tidak akan terlihat lagi di papan warga.',
                              tooltip: 'Kelola pengumuman',
                            ),
                        ],
                      ),
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

class _CoverPickerField extends StatelessWidget {
  const _CoverPickerField({
    required this.coverImageUrl,
    required this.isUploading,
    required this.onPick,
    required this.onRemove,
  });

  final String? coverImageUrl;
  final bool isUploading;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final url = coverImageUrl;
    return Row(
      children: [
        if (url != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(url, width: 56, height: 56, fit: BoxFit.cover),
          )
        else
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: KomplekkuColors.border),
            ),
            child: isUploading
                ? const Center(
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : const Icon(
                    Icons.image_outlined,
                    color: KomplekkuColors.textSecondary,
                  ),
          ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Gambar sampul (opsional)',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: isUploading ? null : onPick,
                    child: Text(url == null ? 'Pilih gambar' : 'Ganti'),
                  ),
                  if (url != null)
                    TextButton(
                      onPressed: onRemove,
                      style: TextButton.styleFrom(
                        foregroundColor: KomplekkuColors.danger,
                      ),
                      child: const Text('Hapus'),
                    ),
                ],
              ),
            ],
          ),
        ),
      ],
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
