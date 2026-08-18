import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/forum/data/forum_repository.dart';
import 'package:komplekku/features/forum/domain/forum_channel.dart';

/// Shared checkbox roster of residents a private forum can invite.
class _ResidentPicker extends ConsumerStatefulWidget {
  const _ResidentPicker({
    required this.selected,
    required this.onToggle,
    required this.excludedUserIds,
    required this.emptyLabel,
  });

  final Set<String> selected;
  final ValueChanged<String> onToggle;
  final Set<String> excludedUserIds;
  final String emptyLabel;

  @override
  ConsumerState<_ResidentPicker> createState() => _ResidentPickerState();
}

class _ResidentPickerState extends ConsumerState<_ResidentPicker> {
  final _searchController = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final candidates = ref.watch(forumMemberCandidateListProvider);

    return candidates.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Text(
        error is ApiException
            ? error.message
            : 'Daftar warga belum dapat dimuat.',
        style: const TextStyle(color: KomplekkuColors.danger),
      ),
      data: (items) {
        final invitable = items
            .where((candidate) =>
                !widget.excludedUserIds.contains(candidate.userId))
            .toList(growable: false);
        if (invitable.isEmpty) {
          return Text(
            widget.emptyLabel,
            style: Theme.of(context).textTheme.bodySmall,
          );
        }

        final term = _search.trim().toLowerCase();
        final filtered = term.isEmpty
            ? invitable
            : invitable
                .where((candidate) =>
                    candidate.displayName.toLowerCase().contains(term) ||
                    (candidate.houseLabel ?? '').toLowerCase().contains(term))
                .toList(growable: false);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _search = value),
              decoration: const InputDecoration(
                hintText: 'Cari nama atau rumah…',
                prefixIcon: Icon(Icons.search),
              ),
            ),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 260),
              child: filtered.isEmpty
                  ? Text(
                      'Tidak ada warga yang cocok.',
                      style: Theme.of(context).textTheme.bodySmall,
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final candidate = filtered[index];
                        return CheckboxListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          controlAffinity: ListTileControlAffinity.leading,
                          value: widget.selected.contains(candidate.userId),
                          onChanged: (_) => widget.onToggle(candidate.userId),
                          title: Text(candidate.displayName),
                          subtitle: candidate.houseLabel == null
                              ? null
                              : Text(candidate.houseLabel!),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}

/// Bottom sheet wrapper that keeps the content above the keyboard and gives
/// every forum sheet the same title/handle treatment.
class _SheetShell extends StatelessWidget {
  const _SheetShell({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
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
                      title,
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
              child,
            ],
          ),
        ),
      ),
    );
  }
}

/// "Buat forum": a warga names a room, describes it, and picks who gets an
/// invitation. Only the people invited here can ever read it.
class CreateForumChannelSheet extends ConsumerStatefulWidget {
  const CreateForumChannelSheet({super.key});

  @override
  ConsumerState<CreateForumChannelSheet> createState() =>
      _CreateForumChannelSheetState();
}

class _CreateForumChannelSheetState
    extends ConsumerState<CreateForumChannelSheet> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _selected = <String>{};
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.length < 3) {
      setState(() => _error = 'Nama forum minimal 3 karakter.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(forumRepositoryProvider).createChannel(
            name: name,
            description: _descriptionController.text.trim(),
            invitedUserIds: _selected.toList(growable: false),
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = error is ApiException
              ? error.message
              : 'Forum belum dapat dibuat.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'Buat forum baru',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            maxLength: 160,
            decoration: const InputDecoration(
              labelText: 'Nama forum',
              hintText: 'Misal: Panitia 17 Agustus',
            ),
          ),
          TextField(
            controller: _descriptionController,
            maxLength: 500,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Deskripsi (opsional)',
              hintText: 'Untuk apa forum ini dibuat?',
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Undang warga',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          Text(
            'Hanya warga yang kamu undang dan menerima undangan yang bisa '
            'membaca forum ini.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          _ResidentPicker(
            selected: _selected,
            excludedUserIds: const {},
            emptyLabel: 'Belum ada warga lain di komunitas ini.',
            onToggle: (userId) => setState(() {
              if (!_selected.remove(userId)) _selected.add(userId);
            }),
          ),
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
              child: Text(_submitting ? 'Membuat…' : 'Buat forum'),
            ),
          ),
        ],
      ),
    );
  }
}

/// Roster of a private forum, plus the entry point to invite more warga.
class ForumMembersSheet extends ConsumerWidget {
  const ForumMembersSheet({super.key, required this.channel});

  final ForumChannel channel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final members = ref.watch(forumChannelMemberListProvider(channel.id));

    return _SheetShell(
      title: 'Anggota ${channel.name}',
      child: members.when(
        loading: () => const Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: Center(child: CircularProgressIndicator()),
        ),
        error: (error, _) => Text(
          error is ApiException
              ? error.message
              : 'Daftar anggota belum dapat dimuat.',
          style: const TextStyle(color: KomplekkuColors.danger),
        ),
        data: (items) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            ...items.map(
              (member) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.person_outline),
                title: Text(member.displayName),
                subtitle: member.houseLabel == null
                    ? null
                    : Text(member.houseLabel!),
                trailing: Text(
                  member.isOwner
                      ? 'Pembuat'
                      : member.status == ForumMemberStatus.pending
                          ? 'Menunggu'
                          : 'Anggota',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ),
            if (channel.membershipStatus == ForumMemberStatus.accepted) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final invited = await showModalBottomSheet<bool>(
                      context: context,
                      isScrollControlled: true,
                      builder: (context) => InviteForumMembersSheet(
                        channel: channel,
                        existingUserIds: items
                            .map((member) => member.userId)
                            .toSet(),
                      ),
                    );
                    if (invited == true) {
                      ref.invalidate(
                        forumChannelMemberListProvider(channel.id),
                      );
                      ref.invalidate(forumChannelListProvider);
                    }
                  },
                  icon: const Icon(Icons.person_add_alt_outlined, size: 18),
                  label: const Text('Undang warga'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Adds more neighbours to an existing private forum.
class InviteForumMembersSheet extends ConsumerStatefulWidget {
  const InviteForumMembersSheet({
    super.key,
    required this.channel,
    required this.existingUserIds,
  });

  final ForumChannel channel;

  /// Anyone already in the room (or still deciding) is not invitable again.
  final Set<String> existingUserIds;

  @override
  ConsumerState<InviteForumMembersSheet> createState() =>
      _InviteForumMembersSheetState();
}

class _InviteForumMembersSheetState
    extends ConsumerState<InviteForumMembersSheet> {
  final _selected = <String>{};
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    if (_selected.isEmpty) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(forumRepositoryProvider).inviteMembers(
            channelId: widget.channel.id,
            userIds: _selected.toList(growable: false),
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = error is ApiException
              ? error.message
              : 'Undangan belum dapat dikirim.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'Undang warga',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _ResidentPicker(
            selected: _selected,
            excludedUserIds: widget.existingUserIds,
            emptyLabel: 'Semua warga sudah diundang ke forum ini.',
            onToggle: (userId) => setState(() {
              if (!_selected.remove(userId)) _selected.add(userId);
            }),
          ),
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
              onPressed: _submitting || _selected.isEmpty ? null : _submit,
              child: Text(
                _submitting
                    ? 'Mengundang…'
                    : 'Undang ${_selected.length} warga',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
