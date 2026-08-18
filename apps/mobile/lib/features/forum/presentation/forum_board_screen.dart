import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/upload/cloudinary_upload.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/forum/data/forum_post_repository.dart';
import 'package:komplekku/features/forum/domain/forum_post.dart';

/// Category tint. Everything stays inside the brand palette — the mockup's
/// green chips map onto the purple/cyan tokens rather than introducing a new
/// hue per category.
Color forumCategoryColor(ForumPostCategory category) => switch (category) {
      ForumPostCategory.question => KomplekkuColors.primary,
      ForumPostCategory.suggestion => KomplekkuColors.accent,
      ForumPostCategory.information => KomplekkuColors.textSecondary,
      ForumPostCategory.environment => KomplekkuColors.success,
      ForumPostCategory.activity => KomplekkuColors.primaryDark,
    };

/// The threaded "Forum Warga" board. Lives beside the chat channels rather
/// than replacing them — see [ForumScreen]'s Diskusi/Obrolan switch.
class ForumBoardView extends ConsumerStatefulWidget {
  const ForumBoardView({super.key});

  @override
  ConsumerState<ForumBoardView> createState() => _ForumBoardViewState();
}

class _ForumBoardViewState extends ConsumerState<ForumBoardView> {
  ForumBoardQuery _query = const ForumBoardQuery();

  Future<void> _createPost() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => const CreateForumPostSheet(),
    );
    if (created == true) ref.invalidate(forumBoardProvider);
  }

  @override
  Widget build(BuildContext context) {
    final board = ref.watch(forumBoardProvider(_query));
    final canPost = hasPermission(
      ref.watch(currentPermissionsProvider),
      'forum.post',
    );

    return Scaffold(
      backgroundColor: KomplekkuColors.background,
      floatingActionButton: canPost
          ? FloatingActionButton.extended(
              onPressed: _createPost,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Buat Post'),
              backgroundColor: KomplekkuColors.primary,
              foregroundColor: Colors.white,
            )
          : null,
      body: Column(
        children: [
          _SortSwitcher(
            sort: _query.sort,
            onChanged: (sort) => setState(() => _query = _query.copyWith(sort: sort)),
          ),
          _CategoryChips(
            category: _query.category,
            onChanged: (category) =>
                setState(() => _query = _query.copyWith(category: category)),
          ),
          Expanded(child: _buildList(board)),
        ],
      ),
    );
  }

  Widget _buildList(AsyncValue<List<ForumPostSummary>> board) {
    return board.when(
      loading: () => const _BoardSkeleton(),
      error: (error, _) {
        final failure =
            error is ApiException ? error : ApiException.malformedResponse();
        if (failure.isUnauthorized) {
          return StatePanel(
            icon: Icons.lock_outline,
            title: 'Sesi sudah berakhir',
            message: 'Masuk kembali untuk membuka papan diskusi.',
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
              ? 'Papan diskusi tidak dapat diakses'
              : 'Diskusi belum bisa dimuat',
          message: failure.message,
          actionLabel: failure.isForbidden ? null : 'Coba lagi',
          onAction: failure.isForbidden
              ? null
              : () => ref.invalidate(forumBoardProvider(_query)),
        );
      },
      data: (posts) {
        if (posts.isEmpty) {
          return RefreshIndicator(
            onRefresh: () => ref.refresh(forumBoardProvider(_query).future),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 40),
                StatePanel(
                  icon: Icons.forum_outlined,
                  title: _query.sort == ForumPostSort.answered
                      ? 'Belum ada yang terjawab'
                      : 'Belum ada diskusi',
                  message: _query.sort == ForumPostSort.answered
                      ? 'Diskusi akan muncul di sini setelah ada warga yang membalas.'
                      : 'Mulai percakapan pertama untuk warga di lingkunganmu.',
                ),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () => ref.refresh(forumBoardProvider(_query).future),
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
            itemCount: posts.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) => ForumPostCard(
              post: posts[index],
              onTap: () => context.push('/forum/${posts[index].id}'),
              onToggleLike: () async {
                await ref
                    .read(forumPostRepositoryProvider)
                    .togglePostLike(posts[index].id);
                ref.invalidate(forumBoardProvider);
              },
            ),
          ),
        );
      },
    );
  }
}

class _SortSwitcher extends StatelessWidget {
  const _SortSwitcher({required this.sort, required this.onChanged});

  final ForumPostSort sort;
  final ValueChanged<ForumPostSort> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: KomplekkuColors.surfaceSoft,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: KomplekkuColors.border),
        ),
        child: Row(
          children: [
            for (final value in ForumPostSort.values)
              Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(value),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOut,
                    padding: const EdgeInsets.symmetric(vertical: 9),
                    decoration: BoxDecoration(
                      color: sort == value
                          ? KomplekkuColors.primary
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Text(
                      forumPostSortLabels[value]!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: sort == value
                            ? Colors.white
                            : KomplekkuColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({required this.category, required this.onChanged});

  final ForumPostCategory? category;
  final ValueChanged<ForumPostCategory?> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: const Text('Semua'),
              selected: category == null,
              onSelected: (_) => onChanged(null),
              selectedColor: KomplekkuColors.primary,
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: category == null
                    ? Colors.white
                    : KomplekkuColors.textPrimary,
              ),
            ),
          ),
          for (final value in ForumPostCategory.values)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(forumPostCategoryLabels[value]!),
                selected: category == value,
                onSelected: (_) => onChanged(value),
                selectedColor: KomplekkuColors.primary,
                labelStyle: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: category == value
                      ? Colors.white
                      : KomplekkuColors.textPrimary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class ForumPostCard extends StatelessWidget {
  const ForumPostCard({
    super.key,
    required this.post,
    required this.onTap,
    required this.onToggleLike,
  });

  final ForumPostSummary post;
  final VoidCallback onTap;
  final Future<void> Function() onToggleLike;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: KomplekkuColors.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: KomplekkuColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ForumAvatar(name: post.authorName),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.authorName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          formatForumRelativeTime(post.createdAt) +
                              (post.isEdited ? ' · diedit' : ''),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  ForumCategoryChip(category: post.category),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                post.title,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                post.excerpt,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: KomplekkuColors.textSecondary,
                      height: 1.45,
                    ),
              ),
              if (post.imageUrls.isNotEmpty) ...[
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    post.imageUrls.first,
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const SizedBox.shrink(),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              const Divider(height: 1, color: KomplekkuColors.border),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.mode_comment_outlined,
                    size: 16,
                    color: KomplekkuColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${post.replyCount} balasan',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(width: 16),
                  ForumLikeButton(
                    likeCount: post.likeCount,
                    likedByMe: post.likedByMe,
                    onToggle: onToggleLike,
                    label: 'suka',
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Initial-letter avatar. Residents have no profile photo in Komplekku, so the
/// mockup's portrait circles become a tinted monogram rather than a fake face.
class ForumAvatar extends StatelessWidget {
  const ForumAvatar({super.key, required this.name, this.size = 38});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: KomplekkuColors.surfaceMuted,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: size * 0.42,
          fontWeight: FontWeight.w800,
          color: KomplekkuColors.primary,
        ),
      ),
    );
  }
}

class ForumCategoryChip extends StatelessWidget {
  const ForumCategoryChip({super.key, required this.category});

  final ForumPostCategory category;

  @override
  Widget build(BuildContext context) {
    final color = forumCategoryColor(category);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        forumPostCategoryLabels[category]!,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

/// The heart, with the little pop the mockup implies when it fills in.
class ForumLikeButton extends StatefulWidget {
  const ForumLikeButton({
    super.key,
    required this.likeCount,
    required this.likedByMe,
    required this.onToggle,
    this.label,
  });

  final int likeCount;
  final bool likedByMe;
  final Future<void> Function() onToggle;
  final String? label;

  @override
  State<ForumLikeButton> createState() => _ForumLikeButtonState();
}

class _ForumLikeButtonState extends State<ForumLikeButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 260),
    lowerBound: 0,
    upperBound: 1,
  );
  bool _busy = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleTap() async {
    if (_busy) return;
    setState(() => _busy = true);
    if (!widget.likedByMe) {
      _controller.forward(from: 0);
    }
    try {
      await widget.onToggle();
    } catch (_) {
      // The list refetch that follows is the source of truth either way.
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final color =
        widget.likedByMe ? KomplekkuColors.danger : KomplekkuColors.textSecondary;

    return InkWell(
      onTap: _handleTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ScaleTransition(
              scale: Tween<double>(begin: 1, end: 1.35).animate(
                CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
              ),
              child: Icon(
                widget.likedByMe ? Icons.favorite : Icons.favorite_border,
                size: 16,
                color: color,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              widget.label == null
                  ? '${widget.likeCount}'
                  : '${widget.likeCount} ${widget.label}',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: color, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

/// Create + edit share one sheet: editing simply pre-fills it and switches the
/// call, so the two never drift apart in validation or layout.
class CreateForumPostSheet extends ConsumerStatefulWidget {
  const CreateForumPostSheet({super.key, this.existing});

  final ForumPostSummary? existing;

  @override
  ConsumerState<CreateForumPostSheet> createState() =>
      _CreateForumPostSheetState();
}

class _CreateForumPostSheetState extends ConsumerState<CreateForumPostSheet> {
  late final TextEditingController _titleController;
  late final TextEditingController _bodyController;
  late ForumPostCategory _category;
  final List<String> _imageUrls = [];
  bool _uploading = false;
  bool _submitting = false;
  String? _error;

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.existing?.title ?? '');
    _bodyController = TextEditingController();
    _category = widget.existing?.category ?? ForumPostCategory.information;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    if (_uploading || _imageUrls.length >= 5) return;
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (picked == null) return;
    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      final url = await uploadImageToCloudinary(picked.path);
      if (mounted) setState(() => _imageUrls.add(url));
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error is CloudinaryConfigError
              ? error.toString()
              : 'Gambar belum dapat diunggah.';
        });
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    final body = _bodyController.text.trim();
    if (title.length < 5) {
      setState(() => _error = 'Judul minimal 5 karakter.');
      return;
    }
    if (body.length < 10) {
      setState(() => _error = 'Isi diskusi minimal 10 karakter.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final repository = ref.read(forumPostRepositoryProvider);
      final existing = widget.existing;
      if (existing != null) {
        await repository.updatePost(
          postId: existing.id,
          category: _category,
          title: title,
          body: body,
        );
      } else {
        await repository.createPost(
          category: _category,
          title: title,
          body: body,
          imageUrls: _imageUrls,
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = error is ApiException
              ? error.message
              : 'Diskusi belum dapat disimpan.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _isEditing ? 'Edit diskusi' : 'Buat diskusi baru',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Tutup',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<ForumPostCategory>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Kategori'),
                items: [
                  for (final value in ForumPostCategory.values)
                    DropdownMenuItem(
                      value: value,
                      child: Text(forumPostCategoryLabels[value]!),
                    ),
                ],
                onChanged: (value) {
                  if (value != null) setState(() => _category = value);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _titleController,
                maxLength: 240,
                decoration: const InputDecoration(
                  labelText: 'Judul',
                  hintText: 'Misal: Usulan pemasangan CCTV di lingkungan RT',
                ),
              ),
              TextField(
                controller: _bodyController,
                maxLines: 6,
                maxLength: 5000,
                decoration: InputDecoration(
                  labelText: 'Isi diskusi',
                  hintText: _isEditing
                      ? 'Tulis ulang isi diskusimu…'
                      : 'Jelaskan maksudmu supaya warga lain mudah menanggapi…',
                ),
              ),
              if (!_isEditing) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: _uploading ? null : _pickImage,
                      icon: const Icon(Icons.image_outlined, size: 18),
                      label: Text(
                        _imageUrls.isEmpty
                            ? 'Tambah foto'
                            : '${_imageUrls.length} foto',
                      ),
                    ),
                    if (_uploading) ...[
                      const SizedBox(width: 12),
                      const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ],
                  ],
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: const TextStyle(color: KomplekkuColors.danger),
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: Text(
                    _submitting
                        ? 'Menyimpan…'
                        : _isEditing
                            ? 'Simpan perubahan'
                            : 'Terbitkan',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BoardSkeleton extends StatelessWidget {
  const _BoardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat diskusi',
      liveRegion: true,
      child: ExcludeSemantics(
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          itemCount: 4,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) => Container(
            height: 150,
            decoration: BoxDecoration(
              color: KomplekkuColors.surfaceSoft,
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      ),
    );
  }
}
