import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/agenda/data/agenda_repository.dart';
import 'package:komplekku/features/agenda/domain/agenda_event.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class AgendaListScreen extends ConsumerStatefulWidget {
  const AgendaListScreen({super.key});

  @override
  ConsumerState<AgendaListScreen> createState() => _AgendaListScreenState();
}

class _AgendaListScreenState extends ConsumerState<AgendaListScreen> {
  AgendaView _view = AgendaView.upcoming;

  @override
  Widget build(BuildContext context) {
    final agenda = ref.watch(agendaListProvider(_view));

    return Scaffold(
      appBar: AppBar(title: const Text('Agenda')),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: SegmentedButton<AgendaView>(
                segments: const [
                  ButtonSegment(
                    value: AgendaView.upcoming,
                    label: Text('Mendatang'),
                  ),
                  ButtonSegment(
                    value: AgendaView.past,
                    label: Text('Lampau'),
                  ),
                ],
                selected: {_view},
                onSelectionChanged: (selection) {
                  setState(() => _view = selection.first);
                },
              ),
            ),
            Expanded(
              child: agenda.when(
                loading: () => const _AgendaListSkeleton(),
                error: (error, _) {
                  final failure = error is ApiException
                      ? error
                      : ApiException.malformedResponse();
                  if (failure.isUnauthorized) {
                    return StatePanel(
                      icon: Icons.lock_outline,
                      title: 'Sesi sudah berakhir',
                      message: 'Masuk kembali untuk melihat agenda.',
                      actionLabel: 'Keluar',
                      onAction: () => ref
                          .read(sessionControllerProvider.notifier)
                          .signOut(),
                    );
                  }
                  return StatePanel(
                    icon: failure.isForbidden
                        ? Icons.block_outlined
                        : Icons.cloud_off_outlined,
                    title: failure.isForbidden
                        ? 'Agenda belum dapat diakses'
                        : 'Agenda belum bisa dimuat',
                    message: failure.message,
                    actionLabel: failure.isForbidden ? null : 'Coba lagi',
                    onAction: failure.isForbidden
                        ? null
                        : () => ref.invalidate(agendaListProvider(_view)),
                  );
                },
                data: (items) {
                  if (items.isEmpty) {
                    return StatePanel(
                      icon: Icons.event_outlined,
                      title: _view == AgendaView.upcoming
                          ? 'Belum ada agenda mendatang'
                          : 'Belum ada agenda lampau',
                      message: _view == AgendaView.upcoming
                          ? 'Kegiatan yang diterbitkan pengurus akan muncul di sini.'
                          : 'Riwayat kegiatan lingkungan akan muncul di sini.',
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.refresh(agendaListProvider(_view).future),
                    child: ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: items.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final event = items[index];
                        return _AgendaCard(
                          event: event,
                          onTap: () => context.push('/aktivitas/agenda/${event.id}'),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AgendaCard extends StatelessWidget {
  const _AgendaCard({required this.event, required this.onTap});

  final AgendaEvent event;
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
              const Icon(Icons.event_outlined, color: KomplekkuColors.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${event.dateLabel} · ${event.timeRangeLabel}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.location,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: KomplekkuColors.textSecondary,
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

class _AgendaListSkeleton extends StatelessWidget {
  const _AgendaListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat agenda',
      liveRegion: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => ExcludeSemantics(
          child: Container(
            height: 96,
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
