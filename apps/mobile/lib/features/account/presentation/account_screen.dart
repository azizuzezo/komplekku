import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/komplekku_logo.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/account/data/account_repository.dart';
import 'package:komplekku/features/account/domain/account_snapshot.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  bool _isLoggingOut = false;

  Future<void> _logout() async {
    if (_isLoggingOut) return;
    setState(() => _isLoggingOut = true);
    try {
      await ref.read(sessionControllerProvider.notifier).signOut();
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _isLoggingOut = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final account = ref.watch(accountSnapshotProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Akun warga')),
      body: SafeArea(
        child: account.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) {
            final failure = error is ApiException
                ? error
                : ApiException.malformedResponse();
            if (failure.isUnauthorized) {
              return StatePanel(
                icon: Icons.lock_outline,
                title: 'Sesi sudah berakhir',
                message: 'Masuk kembali untuk melihat akunmu.',
                actionLabel: 'Keluar',
                onAction: _logout,
              );
            }
            return StatePanel(
              icon: Icons.cloud_off_outlined,
              title: 'Akun belum bisa dimuat',
              message: failure.message,
              actionLabel: 'Coba lagi',
              onAction: () => ref.invalidate(accountSnapshotProvider),
            );
          },
          data: (snapshot) => SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (snapshot.hasActiveResidency)
                  _ResidentCredential(snapshot: snapshot)
                else
                  _AccountStatusCard(snapshot: snapshot),
                const SizedBox(height: 28),
                Text(
                  'Sesi akun',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Keluar jika perangkat ini dipakai bersama orang lain.',
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: _isLoggingOut ? null : _logout,
                  icon: const Icon(Icons.logout),
                  label: Text(
                    _isLoggingOut ? 'Mengakhiri sesi…' : 'Keluar dari akun',
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: KomplekkuColors.danger,
                    side: const BorderSide(color: KomplekkuColors.danger),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ResidentCredential extends StatelessWidget {
  const _ResidentCredential({required this.snapshot});

  final AccountSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final context_ = snapshot.context!;
    return Container(
      // The border must be a foregroundDecoration: it paints after the
      // clipped children, otherwise the opaque white header row covers it.
      foregroundDecoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KomplekkuColors.border),
      ),
      decoration: BoxDecoration(
        color: KomplekkuColors.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              color: KomplekkuColors.surface,
              padding: const EdgeInsets.all(16),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [KomplekkuLogo(width: 36), _StatusBadge()],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Nama warga',
                    style: TextStyle(color: KomplekkuColors.surfaceMuted),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    snapshot.displayName ?? 'Pengguna Komplekku',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: KomplekkuColors.surface,
                      fontSize: 26,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    snapshot.phoneMasked,
                    style: const TextStyle(color: KomplekkuColors.surfaceMuted),
                  ),
                ],
              ),
            ),
            const Divider(color: KomplekkuColors.primaryDark, height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                children: [
                  _CredentialRow(
                    label: 'Lingkungan',
                    value: context_.communityName,
                  ),
                  _CredentialRow(
                    label: 'Rumah',
                    value: context_.house.addressLabel,
                  ),
                  _CredentialRow(
                    label: 'Rumah tangga',
                    value: context_.householdDisplayName,
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: KomplekkuColors.terracotta, width: 3),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    context_.communityName,
                    style: const TextStyle(color: KomplekkuColors.surfaceMuted),
                  ),
                  Text(
                    context_.house.code,
                    style: const TextStyle(
                      color: KomplekkuColors.surface,
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CredentialRow extends StatelessWidget {
  const _CredentialRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(color: KomplekkuColors.surfaceMuted),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: KomplekkuColors.surface,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: KomplekkuColors.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: KomplekkuColors.success.withValues(alpha: 0.4),
        ),
      ),
      child: const Text(
        'Aktif',
        style: TextStyle(
          color: KomplekkuColors.success,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _AccountStatusCard extends StatelessWidget {
  const _AccountStatusCard({required this.snapshot});

  final AccountSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final status = snapshot.residentStatus;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border.all(color: KomplekkuColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const KomplekkuLogo(width: 36),
          const SizedBox(height: 16),
          Text(
            snapshot.displayName ?? 'Pengguna Komplekku',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(snapshot.phoneMasked),
          const SizedBox(height: 16),
          Text(
            status != null
                ? _statusDescription(status)
                : 'Belum ada tempat tinggal yang terhubung ke akun ini.',
          ),
        ],
      ),
    );
  }

  String _statusDescription(AccountResidentStatus status) {
    switch (status) {
      case AccountResidentStatus.pending:
        return 'Permohonan tempat tinggalmu sedang diperiksa pengurus.';
      case AccountResidentStatus.rejected:
        return 'Permohonan tempat tinggal belum dapat disetujui.';
      case AccountResidentStatus.suspended:
        return 'Akses lingkungan untuk akun ini sedang ditangguhkan.';
      case AccountResidentStatus.movedOut:
        return 'Akun ini tidak lagi terhubung dengan rumah sebelumnya.';
      case AccountResidentStatus.active:
        return '';
    }
  }
}
