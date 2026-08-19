import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/forum/data/forum_post_repository.dart';
import 'package:komplekku/features/forum/domain/forum_post.dart';
import 'package:komplekku/features/forum/presentation/forum_board_screen.dart';

const _monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const _weekdayNames = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

String _formatPostedAt(DateTime value) {
  final local = value.toLocal();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '${_weekdayNames[local.weekday - 1]}, ${local.day} '
      '${_monthNames[local.month - 1]} ${local.year} · $hour:$minute WIB';
}

/// One discussion and its replies — the mockup's "Diskusi" screen.
class ForumPostDetailScreen extends ConsumerStatefulWidget {
  const ForumPostDetailScreen({super.key, required this.postId});

  final String postId;

  @override
  ConsumerState<ForumPostDetailScreen> createState() =>
      _ForumPostDetailScreenState();
}

class _ForumPostDetailScreenState extends ConsumerState<ForumPostDetailScreen> {
  final _bodyController = TextEditingController();

  /// The reply being answered, and the one being edited — never both, so the
  /// composer always has exactly one job.
  ForumPostReply? _replyTo;
  ForumPostReply? _editing;
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _bodyController.dispose();
    super.dispose();
  }

  void _resetComposer() {
    _bodyController.clear();
    setState(() {
      _replyTo = null;
      _editing = null;
      _error = null;
    });
  }

  void _refresh() {
    ref.invalidate(forumPostDetailProvider(widget.postId));
    ref.invalidate(forumBoardProvider);
  }

  Future<void> _send() async {
    final body = _bodyController.text.trim();
    if (body.isEmpty || _sending) return;
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      final repository = ref.read(forumPostRepositoryProvider);
      final editing = _editing;
      if (editing != null) {
        await repository.updateReply(replyId: editing.id, body: body);
      } else {
        await repository.createReply(
          postId: widget.postId,
          body: body,
          replyToReplyId: _replyTo?.id,
        );
      }
      _resetComposer();
      _refresh();
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error is ApiException
              ? error.message
              : 'Balasan belum dapat dikirim.';
        });
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<bool> _confirm(String title, String message) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.danger,
            ),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    return result == true;
  }

  Future<void> _deletePost(ForumPostSummary post) async {
    if (!await _confirm(
      'Hapus diskusi?',
      'Diskusi "${post.title}" beserta balasannya tidak akan terlihat lagi oleh warga.',
    )) {
      return;
    }
    try {
      await ref.read(forumPostRepositoryProvider).deletePost(post.id);
      ref.invalidate(forumBoardProvider);
      if (mounted) context.pop();
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
            content: Text('Diskusi belum dapat dihapus. Coba lagi.'),
          ),
        );
      }
    }
  }

  Future<void> _editPost(ForumPostSummary post) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => CreateForumPostSheet(existing: post),
    );
    if (saved == true) _refresh();
  }

  Future<void> _deleteReply(ForumPostReply reply) async {
    if (!await _confirm(
      'Hapus balasan?',
      'Balasan ini tidak akan terlihat lagi oleh warga.',
    )) {
      return;
    }
    try {
      await ref.read(forumPostRepositoryProvider).deleteReply(reply.id);
      _refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Balasan berhasil dihapus.')),
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
            content: Text('Balasan belum dapat dihapus. Coba lagi.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(forumPostDetailProvider(widget.postId));
    final permissions = ref.watch(currentPermissionsProvider);
    final canPost = hasPermission(permissions, 'forum.post');
    final canModerate = hasPermission(permissions, 'forum.manage');
    final myUserId = ref
        .watch(sessionControllerProvider)
        .maybeWhen(data: (session) => session?.userId, orElse: () => null);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Diskusi'),
        actions: [
          detail.maybeWhen(
            data: (value) {
              final isOwn = value.post.authorUserId == myUserId;
              if (!isOwn && !canModerate) return const SizedBox.shrink();
              return PopupMenuButton<String>(
                onSelected: (action) {
                  if (action == 'edit') _editPost(value.post);
                  if (action == 'delete') _deletePost(value.post);
                },
                itemBuilder: (context) => [
                  if (isOwn && canPost)
                    const PopupMenuItem(
                      value: 'edit',
                      child: ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(Icons.edit_outlined),
                        title: Text('Edit diskusi'),
                      ),
                    ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(
                        Icons.delete_outline,
                        color: AppColors.danger,
                      ),
                      title: Text('Hapus diskusi'),
                    ),
                  ),
                ],
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: SafeArea(
        child: detail.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk membuka diskusi ini.',
                actionLabel: 'Keluar',
                onAction: () =>
                    ref.read(sessionControllerProvider.notifier).signOut(),
              );
            }
            if (failure.isNotFound) {
              return const StatePanel(
                icon: Icons.forum_outlined,
                title: 'Diskusi tidak ditemukan',
                message: 'Diskusi ini mungkin sudah dihapus penulisnya.',
              );
            }
            return StatePanel(
              icon: Icons.cloud_off_outlined,
              title: 'Diskusi belum bisa dimuat',
              message: failure.message,
              actionLabel: 'Coba lagi',
              onAction: () =>
                  ref.invalidate(forumPostDetailProvider(widget.postId)),
            );
          },
          data: (value) => Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async => _refresh(),
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                    children: [
                      _PostCard(
                        detail: value,
                        onToggleLike: () async {
                          await ref
                              .read(forumPostRepositoryProvider)
                              .togglePostLike(value.post.id);
                          _refresh();
                        },
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Balasan (${value.replies.length})',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 10),
                      if (value.replies.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceSoft,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            'Belum ada balasan. Jadilah yang pertama menanggapi.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        )
                      else
                        ...value.replies.map(
                          (reply) => _ReplyTile(
                            reply: reply,
                            isOwn: reply.authorUserId == myUserId,
                            canPost: canPost,
                            canModerate: canModerate,
                            onReply: () => setState(() {
                              _editing = null;
                              _replyTo = reply;
                            }),
                            onEdit: () {
                              _bodyController.text = reply.body;
                              setState(() {
                                _replyTo = null;
                                _editing = reply;
                              });
                            },
                            onDelete: () => _deleteReply(reply),
                            onToggleLike: () async {
                              await ref
                                  .read(forumPostRepositoryProvider)
                                  .toggleReplyLike(reply.id);
                              _refresh();
                            },
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (canPost)
                _ReplyComposer(
                  controller: _bodyController,
                  sending: _sending,
                  errorMessage: _error,
                  replyTo: _replyTo,
                  editing: _editing,
                  onSend: _send,
                  onCancelContext: _resetComposer,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.detail, required this.onToggleLike});

  final ForumPostDetail detail;
  final Future<void> Function() onToggleLike;

  @override
  Widget build(BuildContext context) {
    final post = detail.post;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary,
                ),
                child: const Icon(
                  Icons.forum_outlined,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              ForumCategoryChip(category: post.category),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            post.title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              ForumAvatar(name: post.authorName, size: 34),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post.authorName,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      _formatPostedAt(post.createdAt) +
                          (post.isEdited ? ' · diedit' : ''),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            detail.body,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(height: 1.6),
          ),
          if (post.imageUrls.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final url in post.imageUrls)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(
                      url,
                      width: 150,
                      height: 150,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const SizedBox.shrink(),
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 14),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(
                Icons.mode_comment_outlined,
                size: 17,
                color: AppColors.primary,
              ),
              const SizedBox(width: 6),
              Text(
                '${post.replyCount} balasan',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 20),
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
    );
  }
}

class _ReplyTile extends StatelessWidget {
  const _ReplyTile({
    required this.reply,
    required this.isOwn,
    required this.canPost,
    required this.canModerate,
    required this.onReply,
    required this.onEdit,
    required this.onDelete,
    required this.onToggleLike,
  });

  final ForumPostReply reply;
  final bool isOwn;
  final bool canPost;
  final bool canModerate;
  final VoidCallback onReply;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final Future<void> Function() onToggleLike;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ForumAvatar(name: reply.authorName, size: 34),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            reply.authorName,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        Text(
                          formatForumRelativeTime(reply.createdAt) +
                              (reply.isEdited ? ' · diedit' : ''),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                    if (reply.isQuote) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.only(left: 8),
                        decoration: const BoxDecoration(
                          border: Border(
                            left: BorderSide(
                              color: AppColors.borderStrong,
                              width: 3,
                            ),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              reply.replyToAuthorName ?? 'Balasan dihapus',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            Text(
                              reply.replyToBody ??
                                  'Balasan asli sudah dihapus.',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      reply.body,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(height: 1.5),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (canPost)
                          TextButton(
                            onPressed: onReply,
                            style: TextButton.styleFrom(
                              minimumSize: Size.zero,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                                vertical: 2,
                              ),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text('Balas'),
                          ),
                        if (isOwn && canPost)
                          IconButton(
                            tooltip: 'Edit balasan',
                            onPressed: onEdit,
                            iconSize: 16,
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.edit_outlined),
                            color: AppColors.textSecondary,
                          ),
                        if (isOwn || canModerate)
                          IconButton(
                            tooltip: 'Hapus balasan',
                            onPressed: onDelete,
                            iconSize: 16,
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.delete_outline),
                            color: AppColors.textSecondary,
                          ),
                        const Spacer(),
                        ForumLikeButton(
                          likeCount: reply.likeCount,
                          likedByMe: reply.likedByMe,
                          onToggle: onToggleLike,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, color: AppColors.border),
        ],
      ),
    );
  }
}

class _ReplyComposer extends StatelessWidget {
  const _ReplyComposer({
    required this.controller,
    required this.sending,
    required this.errorMessage,
    required this.replyTo,
    required this.editing,
    required this.onSend,
    required this.onCancelContext,
  });

  final TextEditingController controller;
  final bool sending;
  final String? errorMessage;
  final ForumPostReply? replyTo;
  final ForumPostReply? editing;
  final VoidCallback onSend;
  final VoidCallback onCancelContext;

  @override
  Widget build(BuildContext context) {
    final composerContext = editing ?? replyTo;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  errorMessage!,
                  style: const TextStyle(
                    color: AppColors.danger,
                    fontSize: 12,
                  ),
                ),
              ),
            if (composerContext != null)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.fromLTRB(10, 6, 4, 6),
                decoration: BoxDecoration(
                  color: AppColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(10),
                  border: const Border(
                    left: BorderSide(color: AppColors.primary, width: 3),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            editing != null
                                ? 'Mengedit balasan'
                                : 'Membalas ${replyTo!.authorName}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            composerContext.body,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      iconSize: 18,
                      tooltip: 'Batalkan',
                      onPressed: onCancelContext,
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    enabled: !sending,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => onSend(),
                    decoration: InputDecoration(
                      hintText: editing != null
                          ? 'Perbarui balasanmu…'
                          : 'Tulis balasan…',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: sending ? null : onSend,
                  icon: sending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(editing != null ? Icons.check : Icons.send),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
