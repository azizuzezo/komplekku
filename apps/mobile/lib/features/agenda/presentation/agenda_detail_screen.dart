import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/agenda/data/agenda_repository.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class AgendaDetailScreen extends ConsumerWidget {
  const AgendaDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(agendaDetailProvider(id));

    return Scaffold(
      appBar: AppBar(title: const Text('Agenda')),
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
                message: 'Masuk kembali untuk melihat agenda ini.',
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
                  ? 'Agenda ini belum dapat diakses'
                  : 'Agenda belum bisa dimuat',
              message: failure.message,
              actionLabel: failure.isForbidden ? null : 'Coba lagi',
              onAction: failure.isForbidden
                  ? null
                  : () => ref.invalidate(agendaDetailProvider(id)),
            );
          },
          data: (event) => SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 16),
                _DetailRow(
                  icon: Icons.calendar_today_outlined,
                  label: event.dateLabel,
                ),
                const SizedBox(height: 10),
                _DetailRow(
                  icon: Icons.schedule_outlined,
                  label: event.timeRangeLabel,
                ),
                const SizedBox(height: 10),
                _DetailRow(
                  icon: Icons.place_outlined,
                  label: event.location,
                ),
                const SizedBox(height: 10),
                _DetailRow(
                  icon: Icons.person_outline,
                  label: 'Penyelenggara: ${event.organizer}',
                ),
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 20),
                Text(
                  event.description,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: KomplekkuColors.textSecondary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
          ),
        ),
      ],
    );
  }
}
