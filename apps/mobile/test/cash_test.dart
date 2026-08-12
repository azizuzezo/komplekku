import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/cash/domain/cash_transaction.dart';

void main() {
  group('CashTransaction', () {
    test('parses a public income transaction', () {
      final transaction = CashTransaction.fromJson({
        'id': 'cash-1',
        'date': '2026-08-01',
        'category': 'Iuran warga',
        'description': 'Setoran kas RT bulan Agustus',
        'amount': 500000,
        'type': 'INCOME',
        'visibility': 'PUBLIC_TO_RESIDENTS',
        'recordedByName': 'Bendahara Sari',
        'createdAt': '2026-08-01T09:00:00.000Z',
      });

      expect(transaction.type, CashTransactionType.income);
      expect(transaction.visibility, CashVisibility.publicToResidents);
    });

    test('parses an admin-only expense transaction', () {
      final transaction = CashTransaction.fromJson({
        'id': 'cash-2',
        'date': '2026-08-03',
        'category': 'Operasional',
        'description': 'Pembelian alat kebersihan',
        'amount': 120000,
        'type': 'EXPENSE',
        'visibility': 'ADMIN_ONLY',
        'recordedByName': 'Bendahara Sari',
        'createdAt': '2026-08-03T09:00:00.000Z',
      });

      expect(transaction.type, CashTransactionType.expense);
      expect(transaction.visibility, CashVisibility.adminOnly);
    });

    test('throws a FormatException for an unsupported type', () {
      expect(
        () => CashTransaction.fromJson({
          'id': 'cash-3',
          'date': '2026-08-03',
          'category': 'Operasional',
          'description': 'Pembelian alat kebersihan',
          'amount': 120000,
          'type': 'TRANSFER',
          'visibility': 'ADMIN_ONLY',
          'recordedByName': 'Bendahara Sari',
          'createdAt': '2026-08-03T09:00:00.000Z',
        }),
        throwsFormatException,
      );
    });
  });

  group('CashLedgerSnapshot', () {
    test('parses the ledger envelope with items and balances', () {
      final snapshot = CashLedgerSnapshot.fromJson({
        'items': [
          {
            'id': 'cash-1',
            'date': '2026-08-01',
            'category': 'Iuran warga',
            'description': 'Setoran kas RT bulan Agustus',
            'amount': 500000,
            'type': 'INCOME',
            'visibility': 'PUBLIC_TO_RESIDENTS',
            'recordedByName': 'Bendahara Sari',
            'createdAt': '2026-08-01T09:00:00.000Z',
          },
        ],
        'openingBalance': 1000000,
        'totalIncome': 500000,
        'totalExpense': 0,
        'closingBalance': 1500000,
      });

      expect(snapshot.items, hasLength(1));
      expect(snapshot.openingBalance, 1000000);
      expect(snapshot.closingBalance, 1500000);
    });

    test('throws a FormatException when items are missing', () {
      expect(
        () => CashLedgerSnapshot.fromJson({
          'openingBalance': 0,
          'totalIncome': 0,
          'totalExpense': 0,
          'closingBalance': 0,
        }),
        throwsFormatException,
      );
    });
  });
}
