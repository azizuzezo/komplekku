import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/core/widgets/state_panel.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/features/cash/data/cash_repository.dart';
import 'package:komplekku/features/cash/domain/cash_transaction.dart';
import 'package:komplekku/features/cash/presentation/cash_entry_controller.dart';
import 'package:komplekku/features/cash/presentation/format.dart';

/// Dual-mode Transparansi Kas screen mounted at `/layanan/kas`, mirroring
/// `cash-ledger-panel.tsx` (treasurer, `cash.manage`) and
/// `cash-transparency-view.tsx` (resident, `cash.read`) collapsed into one
/// screen: everyone with either permission sees the period ledger; only
/// `cash.manage` holders also see the "Catat transaksi" form above it.
class TransparansiKasScreen extends ConsumerStatefulWidget {
  const TransparansiKasScreen({super.key});

  @override
  ConsumerState<TransparansiKasScreen> createState() =>
      _TransparansiKasScreenState();
}

class _TransparansiKasScreenState extends ConsumerState<TransparansiKasScreen> {
  String _period = currentPeriod();

  @override
  Widget build(BuildContext context) {
    final permissions = ref.watch(currentPermissionsProvider);
    final canManage = hasPermission(permissions, 'cash.manage');
    final canRead = hasPermission(permissions, 'cash.read');

    if (!canManage && !canRead) {
      return Scaffold(
        appBar: AppBar(title: const Text('Transparansi Kas')),
        body: const SafeArea(
          child: StatePanel(
            icon: Icons.lock_outline,
            title: 'Transparansi kas tidak dapat diakses',
            message: 'Akunmu tidak memiliki izin untuk melihat transaksi kas.',
          ),
        ),
      );
    }

    final ledger = ref.watch(cashLedgerProvider(_period));

    return Scaffold(
      appBar: AppBar(title: const Text('Transparansi Kas')),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(cashLedgerProvider(_period).future),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              if (canManage) ...[
                _CashEntryForm(period: _period),
                const SizedBox(height: 20),
              ],
              _PeriodPicker(
                period: _period,
                onChanged: (next) => setState(() => _period = next),
              ),
              const SizedBox(height: 16),
              ledger.when(
                loading: () => const _LedgerSkeleton(),
                error: (error, _) {
                  final failure = error is ApiException
                      ? error
                      : ApiException.malformedResponse();
                  if (failure.isUnauthorized) {
                    return StatePanel(
                      icon: Icons.lock_outline,
                      title: 'Sesi sudah berakhir',
                      message: 'Masuk kembali untuk melihat transaksi kas.',
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
                        ? 'Transaksi kas tidak dapat diakses'
                        : 'Transaksi kas belum bisa dimuat',
                    message: failure.message,
                    actionLabel: failure.isForbidden ? null : 'Coba lagi',
                    onAction: failure.isForbidden
                        ? null
                        : () => ref.invalidate(cashLedgerProvider(_period)),
                  );
                },
                data: (snapshot) => _LedgerView(snapshot: snapshot),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PeriodPicker extends StatelessWidget {
  const _PeriodPicker({required this.period, required this.onChanged});

  final String period;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          onPressed: () => onChanged(shiftPeriod(period, -1)),
          icon: const Icon(Icons.chevron_left),
          tooltip: 'Bulan sebelumnya',
        ),
        Text(
          formatPeriodLabel(period),
          style: Theme.of(context).textTheme.titleMedium,
        ),
        IconButton(
          onPressed: () => onChanged(shiftPeriod(period, 1)),
          icon: const Icon(Icons.chevron_right),
          tooltip: 'Bulan berikutnya',
        ),
      ],
    );
  }
}

class _LedgerSkeleton extends StatelessWidget {
  const _LedgerSkeleton();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Memuat data kas',
      liveRegion: true,
      child: ExcludeSemantics(
        child: Container(
          height: 220,
          decoration: BoxDecoration(
            color: KomplekkuColors.surfaceSoft,
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}

class _LedgerView extends StatelessWidget {
  const _LedgerView({required this.snapshot});

  final CashLedgerSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 2.4,
          children: [
            _SummaryCard(label: 'Saldo awal', value: snapshot.openingBalance),
            _SummaryCard(
              label: 'Pemasukan',
              value: snapshot.totalIncome,
              color: KomplekkuColors.success,
            ),
            _SummaryCard(
              label: 'Pengeluaran',
              value: snapshot.totalExpense,
              color: KomplekkuColors.danger,
            ),
            _SummaryCard(label: 'Saldo akhir', value: snapshot.closingBalance),
          ],
        ),
        const SizedBox(height: 20),
        Text('Transaksi', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 10),
        if (snapshot.items.isEmpty)
          const StatePanel(
            icon: Icons.receipt_long_outlined,
            title: 'Belum ada transaksi kas pada periode ini',
            message:
                'Transaksi kas yang tercatat pada periode ini akan muncul di sini.',
          )
        else
          Column(
            children: [
              for (final transaction in snapshot.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _TransactionRow(transaction: transaction),
                ),
            ],
          ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.label, required this.value, this.color});

  final String label;
  final int value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KomplekkuColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              formatRupiah(value),
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TransactionRow extends StatelessWidget {
  const _TransactionRow({required this.transaction});

  final CashTransaction transaction;

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.type == CashTransactionType.income;
    final color = isIncome ? KomplekkuColors.success : KomplekkuColors.danger;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.visibility == CashVisibility.adminOnly
                        ? '${transaction.category} · Khusus pengurus'
                        : transaction.category,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${formatDateOnly(transaction.date)} · ${transaction.description}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  Text(
                    'Dicatat oleh ${transaction.recordedByName}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: KomplekkuColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
            Text(
              '${isIncome ? '+' : '-'}${formatRupiah(transaction.amount.abs())}',
              style: TextStyle(color: color, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

class _CashEntryForm extends ConsumerStatefulWidget {
  const _CashEntryForm({required this.period});

  final String period;

  @override
  ConsumerState<_CashEntryForm> createState() => _CashEntryFormState();
}

class _CashEntryFormState extends ConsumerState<_CashEntryForm> {
  final _formKey = GlobalKey<FormState>();
  final _categoryController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime _date = DateTime.now();
  CashTransactionType _type = CashTransactionType.income;
  CashVisibility _visibility = CashVisibility.publicToResidents;

  @override
  void dispose() {
    _categoryController.dispose();
    _descriptionController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  String get _dateIso {
    final month = _date.month.toString().padLeft(2, '0');
    final day = _date.day.toString().padLeft(2, '0');
    return '${_date.year}-$month-$day';
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 1),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final amount = int.tryParse(_amountController.text.trim());
    if (amount == null) return;

    final created = await ref.read(cashEntryControllerProvider.notifier).submit(
          date: _dateIso,
          category: _categoryController.text.trim(),
          description: _descriptionController.text.trim(),
          amount: amount,
          type: _type,
          visibility: _visibility,
        );
    if (created != null) {
      _categoryController.clear();
      _descriptionController.clear();
      _amountController.clear();
      setState(() {
        _date = DateTime.now();
        _type = CashTransactionType.income;
        _visibility = CashVisibility.publicToResidents;
      });
      ref.invalidate(cashLedgerProvider(widget.period));
    }
  }

  @override
  Widget build(BuildContext context) {
    final entryState = ref.watch(cashEntryControllerProvider);
    final isSubmitting = entryState.value?.isSubmitting ?? entryState.isLoading;
    final submissionError = entryState.value?.submissionError;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Catat transaksi', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 14),
              Text('Tanggal', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              OutlinedButton(
                onPressed: _pickDate,
                style: OutlinedButton.styleFrom(alignment: Alignment.centerLeft),
                child: Text(formatDateOnly(_dateIso)),
              ),
              const SizedBox(height: 14),
              Text('Kategori', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _categoryController,
                validator: (value) {
                  if ((value ?? '').trim().length < 2) {
                    return 'Kategori minimal 2 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Text('Keterangan', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                validator: (value) {
                  if ((value ?? '').trim().length < 3) {
                    return 'Keterangan minimal 3 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Text('Jumlah (Rp)', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                validator: (value) {
                  final parsed = int.tryParse((value ?? '').trim());
                  if (parsed == null || parsed <= 0) {
                    return 'Masukkan jumlah lebih dari 0.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Text('Jenis', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              SegmentedButton<CashTransactionType>(
                segments: const [
                  ButtonSegment(
                    value: CashTransactionType.income,
                    label: Text('Pemasukan'),
                  ),
                  ButtonSegment(
                    value: CashTransactionType.expense,
                    label: Text('Pengeluaran'),
                  ),
                ],
                selected: {_type},
                onSelectionChanged: (selection) =>
                    setState(() => _type = selection.first),
              ),
              const SizedBox(height: 14),
              Text('Visibilitas', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              DropdownButtonFormField<CashVisibility>(
                initialValue: _visibility,
                items: CashVisibility.values
                    .map(
                      (visibility) => DropdownMenuItem(
                        value: visibility,
                        child: Text(cashVisibilityLabel(visibility)),
                      ),
                    )
                    .toList(growable: false),
                onChanged: (value) {
                  if (value != null) setState(() => _visibility = value);
                },
              ),
              const SizedBox(height: 4),
              Text(
                'Transaksi khusus pengurus tidak akan muncul di halaman transparansi kas warga.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: KomplekkuColors.textSecondary,
                    ),
              ),
              if (submissionError != null) ...[
                const SizedBox(height: 10),
                Text(
                  submissionError.message,
                  style: TextStyle(color: KomplekkuColors.danger),
                ),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Catat transaksi'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
