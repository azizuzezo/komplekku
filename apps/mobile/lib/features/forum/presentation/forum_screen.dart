import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/upload/cloudinary_upload.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/forum/data/forum_repository.dart';
import 'package:komplekku/features/forum/domain/forum_channel.dart';
import 'package:komplekku/features/forum/domain/forum_message.dart';
import 'package:komplekku/features/forum/presentation/forum_board_screen.dart';
import 'package:komplekku/features/forum/presentation/forum_channel_sheets.dart';

const _maxAttachments = 5;

/// Forum Warga has no server push for the app-in-background case beyond the
/// existing FCM notification on new messages — while this screen is open we
/// poll on a short interval instead of holding an SSE/WebSocket connection,
/// mirroring `RealtimeNotificationService`'s established pattern for the
/// mobile app rather than introducing a new realtime transport.
const _pollInterval = Duration(seconds: 5);

/// The Forum tab holds two different things under one name: a threaded
/// discussion board (titles, categories, likes, replies) and the realtime chat
/// channels, including the invitation-only private forums. They are not two
/// views of the same data, so the switch is explicit rather than a filter.
class ForumScreen extends StatefulWidget {
  const ForumScreen({super.key});

  @override
  State<ForumScreen> createState() => _ForumTabsState();
}

class _ForumTabsState extends State<ForumScreen> {
  bool _showBoard = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KomplekkuColors.background,
      appBar: AppBar(
        title: const Text('Forum Warga'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: KomplekkuColors.surfaceSoft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: KomplekkuColors.border),
              ),
              child: Row(
                children: [
                  for (final entry in const [
                    (true, 'Diskusi', Icons.article_outlined),
                    (false, 'Obrolan', Icons.chat_bubble_outline),
                  ])
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _showBoard = entry.$1),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          curve: Curves.easeOut,
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          decoration: BoxDecoration(
                            color: _showBoard == entry.$1
                                ? KomplekkuColors.primary
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                entry.$3,
                                size: 16,
                                color: _showBoard == entry.$1
                                    ? Colors.white
                                    : KomplekkuColors.textSecondary,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                entry.$2,
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                  color: _showBoard == entry.$1
                                      ? Colors.white
                                      : KomplekkuColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: _showBoard ? const ForumBoardView() : const ForumChatView(),
    );
  }
}

class ForumChatView extends ConsumerStatefulWidget {
  const ForumChatView({super.key});

  @override
  ConsumerState<ForumChatView> createState() => _ForumScreenState();
}

class _ForumScreenState extends ConsumerState<ForumChatView> {
  String? _activeChannelId;
  final _bodyController = TextEditingController();
  Timer? _pollTimer;
  String? _polledChannelId;
  bool _sending = false;
  String? _sendError;
  final List<String> _imageUrls = [];
  bool _uploadingImage = false;

  /// The message being replied to, and the one being edited — never both, so
  /// the composer always has exactly one job.
  ForumMessage? _replyTo;
  ForumMessage? _editing;

  @override
  void dispose() {
    _pollTimer?.cancel();
    _bodyController.dispose();
    super.dispose();
  }

  /// Restarts the poll whenever the open channel changes, so switching rooms
  /// stops refetching the one that is no longer on screen.
  void _ensurePolling(String channelId) {
    if (_polledChannelId == channelId && _pollTimer != null) return;
    _pollTimer?.cancel();
    _polledChannelId = channelId;
    _pollTimer = Timer.periodic(_pollInterval, (_) {
      ref.invalidate(forumMessageListProvider(channelId));
    });
  }

  void _resetComposer() {
    _bodyController.clear();
    setState(() {
      _imageUrls.clear();
      _replyTo = null;
      _editing = null;
      _sendError = null;
    });
  }

  void _selectChannel(String channelId) {
    if (channelId == _activeChannelId) return;
    // A half-written reply or edit must not follow the user into another
    // room, where its target message does not even exist.
    setState(() => _activeChannelId = channelId);
    _resetComposer();
  }

  Future<void> _pickImage() async {
    if (_uploadingImage || _imageUrls.length >= _maxAttachments) return;
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (picked == null) return;
    setState(() {
      _uploadingImage = true;
      _sendError = null;
    });
    try {
      final url = await uploadImageToCloudinary(picked.path);
      if (mounted) setState(() => _imageUrls.add(url));
    } catch (error) {
      if (mounted) {
        setState(() {
          _sendError = error is CloudinaryConfigError
              ? error.toString()
              : 'Gambar belum dapat diunggah.';
        });
      }
    } finally {
      if (mounted) setState(() => _uploadingImage = false);
    }
  }

  Future<void> _send(String channelId) async {
    final body = _bodyController.text.trim();
    final editing = _editing;
    if (_sending) return;
    if (editing != null ? body.isEmpty : body.isEmpty && _imageUrls.isEmpty) {
      return;
    }
    setState(() {
      _sending = true;
      _sendError = null;
    });
    try {
      final repository = ref.read(forumRepositoryProvider);
      if (editing != null) {
        await repository.editMessage(messageId: editing.id, body: body);
      } else {
        await repository.sendMessage(
          channelId: channelId,
          body: body.isEmpty ? ' ' : body,
          imageUrls: _imageUrls,
          replyToMessageId: _replyTo?.id,
        );
      }
      _resetComposer();
      ref.invalidate(forumMessageListProvider(channelId));
    } catch (error) {
      if (mounted) {
        setState(() {
          _sendError = error is ApiException
              ? error.message
              : 'Pesan belum dapat dikirim.';
        });
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _delete(String channelId, String messageId) async {
    try {
      await ref.read(forumRepositoryProvider).deleteMessage(messageId);
      ref.invalidate(forumMessageListProvider(channelId));
    } catch (_) {
      // Best-effort: the list refetch on next poll will reconcile either way.
    }
  }

  Future<void> _respondToInvitation(
    ForumChannel channel, {
    required bool accept,
  }) async {
    try {
      await ref.read(forumRepositoryProvider).respondToInvitation(
            channelId: channel.id,
            accept: accept,
          );
      ref.invalidate(forumChannelListProvider);
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  Future<void> _createChannel() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => const CreateForumChannelSheet(),
    );
    if (created == true) ref.invalidate(forumChannelListProvider);
  }

  @override
  Widget build(BuildContext context) {
    final channels = ref.watch(forumChannelListProvider);
    final permissions = ref.watch(currentPermissionsProvider);
    final canPost = permissions.contains('forum.post');
    final canModerate = permissions.contains('forum.manage');
    final myUserId = ref.watch(sessionControllerProvider).maybeWhen(
          data: (session) => session?.userId,
          orElse: () => null,
        );

    return Scaffold(
      backgroundColor: KomplekkuColors.background,
      floatingActionButton: canPost
          ? FloatingActionButton.extended(
              onPressed: _createChannel,
              icon: const Icon(Icons.add_comment_outlined),
              label: const Text('Buat Forum'),
              backgroundColor: KomplekkuColors.primary,
              foregroundColor: Colors.white,
            )
          : null,
      body: SafeArea(
        child: channels.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            return StatePanel(
              icon: failure.isForbidden
                  ? Icons.block_outlined
                  : Icons.cloud_off_outlined,
              title: failure.isForbidden
                  ? 'Forum Warga belum dapat diakses'
                  : 'Forum belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(forumChannelListProvider),
            );
          },
          data: (items) {
            // A pending invitation is not a room you can read yet — it is a
            // decision to make, so those channels sit in their own banner
            // above the thread instead of in the tab strip.
            final invitations =
                items.where((channel) => channel.isPendingInvitation).toList();
            final openChannels =
                items.where((channel) => !channel.isPendingInvitation).toList();

            if (openChannels.isEmpty) {
              return ListView(
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  if (invitations.isNotEmpty)
                    _InvitationBanner(
                      invitations: invitations,
                      onRespond: _respondToInvitation,
                    ),
                  StatePanel(
                    icon: Icons.forum_outlined,
                    title: 'Belum ada forum yang bisa dibuka',
                    message: invitations.isNotEmpty
                        ? 'Terima salah satu undangan di atas untuk mulai mengobrol.'
                        : 'Buat forum sendiri lalu undang warga yang ingin kamu ajak.',
                  ),
                ],
              );
            }

            // Also re-anchors when the active forum disappears (invitation
            // declined elsewhere, forum left) instead of polling a dead id.
            if (_activeChannelId == null ||
                !openChannels.any((channel) => channel.id == _activeChannelId)) {
              _activeChannelId = openChannels.first.id;
            }
            final activeChannelId = _activeChannelId!;
            final activeChannel = openChannels
                .firstWhere((channel) => channel.id == activeChannelId);
            _ensurePolling(activeChannelId);

            final isChannelModerator = activeChannel.isPrivate
                ? activeChannel.isOwner
                : canModerate;

            return Column(
              children: [
                _ChannelTabs(
                  channels: openChannels,
                  activeChannelId: activeChannelId,
                  onSelect: _selectChannel,
                ),
                if (invitations.isNotEmpty)
                  _InvitationBanner(
                    invitations: invitations,
                    onRespond: _respondToInvitation,
                  ),
                if (activeChannel.isPrivate)
                  _PrivateChannelHeader(channel: activeChannel),
                Expanded(
                  child: _MessageList(
                    channelId: activeChannelId,
                    myUserId: myUserId,
                    canPost: canPost,
                    isChannelModerator: isChannelModerator,
                    onDelete: (messageId) => _delete(activeChannelId, messageId),
                    onReply: (message) => setState(() {
                      _editing = null;
                      _replyTo = message;
                    }),
                    onEdit: (message) {
                      _bodyController.text = message.body;
                      setState(() {
                        _replyTo = null;
                        _editing = message;
                      });
                    },
                  ),
                ),
                if (canPost)
                  _Composer(
                    controller: _bodyController,
                    sending: _sending,
                    errorMessage: _sendError,
                    imageUrls: _imageUrls,
                    uploadingImage: _uploadingImage,
                    replyTo: _replyTo,
                    editing: _editing,
                    onSend: () => _send(activeChannelId),
                    onPickImage: _pickImage,
                    onRemoveImage: (url) => setState(() => _imageUrls.remove(url)),
                    onCancelContext: _resetComposer,
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ChannelTabs extends StatelessWidget {
  const _ChannelTabs({
    required this.channels,
    required this.activeChannelId,
    required this.onSelect,
  });

  final List<ForumChannel> channels;
  final String activeChannelId;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        itemCount: channels.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final channel = channels[index];
          final isActive = channel.id == activeChannelId;
          return ChoiceChip(
            avatar: channel.isPrivate
                ? Icon(
                    Icons.lock_outline,
                    size: 14,
                    color: isActive ? Colors.white : KomplekkuColors.textSecondary,
                  )
                : null,
            label: Text(channel.label),
            selected: isActive,
            onSelected: (_) => onSelect(channel.id),
            selectedColor: KomplekkuColors.primary,
            labelStyle: TextStyle(
              color: isActive ? Colors.white : KomplekkuColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          );
        },
      ),
    );
  }
}

class _InvitationBanner extends StatelessWidget {
  const _InvitationBanner({
    required this.invitations,
    required this.onRespond,
  });

  final List<ForumChannel> invitations;
  final void Function(ForumChannel channel, {required bool accept}) onRespond;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: invitations
          .map(
            (invitation) => Container(
              margin: const EdgeInsets.fromLTRB(12, 6, 12, 0),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: KomplekkuColors.surfaceSoft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: KomplekkuColors.primary),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Undangan forum',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                          color: KomplekkuColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    invitation.name,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  if (invitation.description != null &&
                      invitation.description!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      invitation.description!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      FilledButton(
                        onPressed: () => onRespond(invitation, accept: true),
                        child: const Text('Terima'),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => onRespond(invitation, accept: false),
                        child: const Text('Tolak'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          )
          .toList(growable: false),
    );
  }
}

class _PrivateChannelHeader extends ConsumerWidget {
  const _PrivateChannelHeader({required this.channel});

  final ForumChannel channel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: KomplekkuColors.border),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  channel.name,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (channel.description != null &&
                    channel.description!.isNotEmpty)
                  Text(
                    channel.description!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: () => showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              builder: (context) => ForumMembersSheet(channel: channel),
            ),
            icon: const Icon(Icons.group_outlined, size: 16),
            label: Text('${channel.memberCount}'),
          ),
        ],
      ),
    );
  }
}

class _MessageList extends ConsumerWidget {
  const _MessageList({
    required this.channelId,
    required this.myUserId,
    required this.canPost,
    required this.isChannelModerator,
    required this.onDelete,
    required this.onReply,
    required this.onEdit,
  });

  final String channelId;
  final String? myUserId;
  final bool canPost;
  final bool isChannelModerator;
  final ValueChanged<String> onDelete;
  final ValueChanged<ForumMessage> onReply;
  final ValueChanged<ForumMessage> onEdit;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messages = ref.watch(forumMessageListProvider(channelId));
    return messages.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => StatePanel(
        icon: Icons.cloud_off_outlined,
        title: 'Pesan belum bisa dimuat',
        message: error is ApiException
            ? error.message
            : 'Terjadi kendala saat mengambil pesan.',
        actionLabel: 'Coba lagi',
        onAction: () => ref.invalidate(forumMessageListProvider(channelId)),
      ),
      data: (items) {
        if (items.isEmpty) {
          return const StatePanel(
            icon: Icons.chat_bubble_outline,
            title: 'Belum ada pesan',
            message: 'Jadilah yang pertama menyapa warga di channel ini.',
          );
        }
        return ListView.builder(
          reverse: true,
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final message = items[index];
            final isOwn = message.authorUserId == myUserId;
            return _MessageBubble(
              message: message,
              isOwn: isOwn,
              canReply: canPost,
              canEdit: isOwn && canPost,
              canDelete: isOwn || isChannelModerator,
              onDelete: () => onDelete(message.id),
              onReply: () => onReply(message),
              onEdit: () => onEdit(message),
            );
          },
        );
      },
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isOwn,
    required this.canReply,
    required this.canEdit,
    required this.canDelete,
    required this.onDelete,
    required this.onReply,
    required this.onEdit,
  });

  final ForumMessage message;
  final bool isOwn;
  final bool canReply;
  final bool canEdit;
  final bool canDelete;
  final VoidCallback onDelete;
  final VoidCallback onReply;
  final VoidCallback onEdit;

  String _formatTime(DateTime value) {
    final local = value.toLocal();
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final foreground = isOwn ? Colors.white : KomplekkuColors.textPrimary;
    final mutedForeground =
        isOwn ? Colors.white70 : KomplekkuColors.textSecondary;

    return Align(
      alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isOwn ? KomplekkuColors.primary : KomplekkuColors.surfaceSoft,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isOwn)
              Text(
                message.authorName,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            if (message.isReply)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.only(left: 8),
                decoration: BoxDecoration(
                  border: Border(
                    left: BorderSide(color: mutedForeground, width: 3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      message.replyToAuthorName ?? 'Pesan dihapus',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: mutedForeground,
                      ),
                    ),
                    Text(
                      message.replyToBody ?? 'Pesan asli sudah dihapus.',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11, color: mutedForeground),
                    ),
                  ],
                ),
              ),
            if (message.body.trim().isNotEmpty)
              Text(message.body, style: TextStyle(color: foreground)),
            if (message.imageUrls.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final url in message.imageUrls)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          url,
                          width: 140,
                          height: 140,
                          fit: BoxFit.cover,
                        ),
                      ),
                  ],
                ),
              ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${_formatTime(message.createdAt)}'
                  '${message.isEdited ? ' · diedit' : ''}',
                  style: TextStyle(fontSize: 11, color: mutedForeground),
                ),
                if (canReply) ...[
                  const SizedBox(width: 8),
                  _BubbleAction(
                    icon: Icons.reply_outlined,
                    tooltip: 'Balas pesan',
                    color: mutedForeground,
                    onTap: onReply,
                  ),
                ],
                if (canEdit) ...[
                  const SizedBox(width: 8),
                  _BubbleAction(
                    icon: Icons.edit_outlined,
                    tooltip: 'Edit pesan',
                    color: mutedForeground,
                    onTap: onEdit,
                  ),
                ],
                if (canDelete) ...[
                  const SizedBox(width: 8),
                  _BubbleAction(
                    icon: Icons.delete_outline,
                    tooltip: 'Hapus pesan',
                    color: mutedForeground,
                    onTap: onDelete,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BubbleAction extends StatelessWidget {
  const _BubbleAction({
    required this.icon,
    required this.tooltip,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        child: Icon(icon, size: 15, color: color),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.sending,
    required this.errorMessage,
    required this.imageUrls,
    required this.uploadingImage,
    required this.replyTo,
    required this.editing,
    required this.onSend,
    required this.onPickImage,
    required this.onRemoveImage,
    required this.onCancelContext,
  });

  final TextEditingController controller;
  final bool sending;
  final String? errorMessage;
  final List<String> imageUrls;
  final bool uploadingImage;
  final ForumMessage? replyTo;
  final ForumMessage? editing;
  final VoidCallback onSend;
  final VoidCallback onPickImage;
  final ValueChanged<String> onRemoveImage;
  final VoidCallback onCancelContext;

  @override
  Widget build(BuildContext context) {
    final composerContext = editing ?? replyTo;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  errorMessage!,
                  style: const TextStyle(
                    color: KomplekkuColors.danger,
                    fontSize: 12,
                  ),
                ),
              ),
            if (composerContext != null)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.fromLTRB(10, 6, 4, 6),
                decoration: BoxDecoration(
                  color: KomplekkuColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(10),
                  border: const Border(
                    left: BorderSide(color: KomplekkuColors.primary, width: 3),
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
                                ? 'Mengedit pesan'
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
                              color: KomplekkuColors.textSecondary,
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
            if (imageUrls.isNotEmpty || uploadingImage)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: SizedBox(
                  height: 56,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      for (final url in imageUrls)
                        Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  url,
                                  width: 56,
                                  height: 56,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              Positioned(
                                top: -6,
                                right: -6,
                                child: IconButton(
                                  iconSize: 16,
                                  icon: const Icon(
                                    Icons.cancel,
                                    color: KomplekkuColors.danger,
                                  ),
                                  onPressed: () => onRemoveImage(url),
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (uploadingImage)
                        const SizedBox(
                          width: 56,
                          height: 56,
                          child: Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            Row(
              children: [
                // Editing replaces the text of an existing message; adding
                // attachments there would need a different endpoint shape, so
                // the picker steps aside until the edit is done.
                if (editing == null)
                  IconButton(
                    onPressed: (sending || uploadingImage) ? null : onPickImage,
                    icon: const Icon(Icons.image_outlined),
                    color: KomplekkuColors.textSecondary,
                  ),
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
                          ? 'Perbarui pesanmu…'
                          : 'Tulis pesan untuk warga…',
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
                    backgroundColor: KomplekkuColors.primary,
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
