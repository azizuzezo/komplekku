import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/agenda/data/agenda_repository.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/shared/widgets/app_loading_state.dart';

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
          loading: () => const AppLoadingState(),
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
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: AppTypography.heading),
                const SizedBox(height: AppSpacing.base),
                _DetailRow(
                  icon: Icons.calendar_today_outlined,
                  label: event.dateLabel,
                ),
                const SizedBox(height: AppSpacing.sm),
                _DetailRow(
                  icon: Icons.schedule_outlined,
                  label: event.timeRangeLabel,
                ),
                const SizedBox(height: AppSpacing.sm),
                _DetailRow(
                  icon: Icons.place_outlined,
                  label: event.location,
                ),
                const SizedBox(height: AppSpacing.sm),
                _DetailRow(
                  icon: Icons.person_outline,
                  label: 'Penyelenggara: ${event.organizer}',
                ),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.lg),
                Text(event.description, style: AppTypography.bodyLarge),
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
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(label, style: AppTypography.tabular(AppTypography.bodyLarge)),
        ),
      ],
    );
  }
}
