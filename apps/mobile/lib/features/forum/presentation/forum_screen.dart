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

const _maxAttachments = 5;

/// Forum Warga has no server push for the app-in-background case beyond the
/// existing FCM notification on new messages — while this screen is open we
/// poll on a short interval instead of holding an SSE/WebSocket connection,
/// mirroring `RealtimeNotificationService`'s established pattern for the
/// mobile app rather than introducing a new realtime transport.
const _pollInterval = Duration(seconds: 5);

class ForumScreen extends ConsumerStatefulWidget {
  const ForumScreen({super.key});

  @override
  ConsumerState<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends ConsumerState<ForumScreen> {
  String? _activeChannelId;
  final _bodyController = TextEditingController();
  Timer? _pollTimer;
  bool _sending = false;
  String? _sendError;
  final List<String> _imageUrls = [];
  bool _uploadingImage = false;

  @override
  void dispose() {
    _pollTimer?.cancel();
    _bodyController.dispose();
    super.dispose();
  }

  void _ensurePolling(String channelId) {
    if (_pollTimer != null) return;
    _pollTimer = Timer.periodic(_pollInterval, (_) {
      ref.invalidate(forumMessageListProvider(channelId));
    });
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
      setState(() => _imageUrls.add(url));
    } catch (error) {
      setState(() {
        _sendError = error is CloudinaryConfigError
            ? error.toString()
            : 'Gambar belum dapat diunggah.';
      });
    } finally {
      if (mounted) setState(() => _uploadingImage = false);
    }
  }

  Future<void> _send(String channelId) async {
    final body = _bodyController.text.trim();
    if ((body.isEmpty && _imageUrls.isEmpty) || _sending) return;
    setState(() {
      _sending = true;
      _sendError = null;
    });
    try {
      await ref.read(forumRepositoryProvider).sendMessage(
            channelId: channelId,
            body: body.isEmpty ? ' ' : body,
            imageUrls: _imageUrls,
          );
      _bodyController.clear();
      setState(() => _imageUrls.clear());
      ref.invalidate(forumMessageListProvider(channelId));
    } catch (error) {
      setState(() {
        _sendError = error is ApiException
            ? error.message
            : 'Pesan belum dapat dikirim.';
      });
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
      appBar: AppBar(title: const Text('Forum Warga')),
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
            if (items.isEmpty) {
              return const StatePanel(
                icon: Icons.forum_outlined,
                title: 'Belum ada channel forum',
                message:
                    'Channel forum muncul otomatis setelah RT atau komunitasmu terdaftar.',
              );
            }
            _activeChannelId ??= items.first.id;
            final activeChannelId = _activeChannelId!;
            _ensurePolling(activeChannelId);

            return Column(
              children: [
                _ChannelTabs(
                  channels: items,
                  activeChannelId: activeChannelId,
                  onSelect: (id) => setState(() => _activeChannelId = id),
                ),
                Expanded(
                  child: _MessageList(
                    channelId: activeChannelId,
                    myUserId: myUserId,
                    canModerate: canModerate,
                    onDelete: (messageId) => _delete(activeChannelId, messageId),
                  ),
                ),
                if (canPost)
                  _Composer(
                    controller: _bodyController,
                    sending: _sending,
                    errorMessage: _sendError,
                    imageUrls: _imageUrls,
                    uploadingImage: _uploadingImage,
                    onSend: () => _send(activeChannelId),
                    onPickImage: _pickImage,
                    onRemoveImage: (url) => setState(() => _imageUrls.remove(url)),
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
            label: Text(channel.rtId == null ? 'Semua RT' : channel.name),
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

class _MessageList extends ConsumerWidget {
  const _MessageList({
    required this.channelId,
    required this.myUserId,
    required this.canModerate,
    required this.onDelete,
  });

  final String channelId;
  final String? myUserId;
  final bool canModerate;
  final ValueChanged<String> onDelete;

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
            final canDelete = isOwn || canModerate;
            return Align(
              alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.78,
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isOwn
                      ? KomplekkuColors.primary
                      : KomplekkuColors.surfaceSoft,
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
                    if (message.body.trim().isNotEmpty)
                      Text(
                        message.body,
                        style: TextStyle(
                          color: isOwn ? Colors.white : KomplekkuColors.textPrimary,
                        ),
                      ),
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
                          _formatTime(message.createdAt),
                          style: TextStyle(
                            fontSize: 11,
                            color: isOwn
                                ? Colors.white70
                                : KomplekkuColors.textSecondary,
                          ),
                        ),
                        if (canDelete) ...[
                          const SizedBox(width: 6),
                          InkWell(
                            onTap: () => onDelete(message.id),
                            child: Icon(
                              Icons.delete_outline,
                              size: 14,
                              color: isOwn
                                  ? Colors.white70
                                  : KomplekkuColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  String _formatTime(DateTime value) {
    final local = value.toLocal();
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.sending,
    required this.errorMessage,
    required this.imageUrls,
    required this.uploadingImage,
    required this.onSend,
    required this.onPickImage,
    required this.onRemoveImage,
  });

  final TextEditingController controller;
  final bool sending;
  final String? errorMessage;
  final List<String> imageUrls;
  final bool uploadingImage;
  final VoidCallback onSend;
  final VoidCallback onPickImage;
  final ValueChanged<String> onRemoveImage;

  @override
  Widget build(BuildContext context) {
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
                  style: const TextStyle(color: KomplekkuColors.danger, fontSize: 12),
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
                                  icon: const Icon(Icons.cancel, color: KomplekkuColors.danger),
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
                    decoration: const InputDecoration(
                      hintText: 'Tulis pesan untuk warga…',
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
                      : const Icon(Icons.send),
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
