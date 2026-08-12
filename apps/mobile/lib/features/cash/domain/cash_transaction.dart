enum CashTransactionType {
  income('INCOME'),
  expense('EXPENSE');

  const CashTransactionType(this.apiValue);

  final String apiValue;

  static CashTransactionType fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Cash transaction type is invalid.');
    }
    for (final type in values) {
      if (type.apiValue == value) return type;
    }
    throw FormatException('Unsupported cash transaction type: $value');
  }
}

String cashTransactionTypeLabel(CashTransactionType type) {
  switch (type) {
    case CashTransactionType.income:
      return 'Pemasukan';
    case CashTransactionType.expense:
      return 'Pengeluaran';
  }
}

enum CashVisibility {
  publicToResidents('PUBLIC_TO_RESIDENTS'),
  adminOnly('ADMIN_ONLY');

  const CashVisibility(this.apiValue);

  final String apiValue;

  static CashVisibility fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Cash visibility is invalid.');
    }
    for (final visibility in values) {
      if (visibility.apiValue == value) return visibility;
    }
    throw FormatException('Unsupported cash visibility: $value');
  }
}

String cashVisibilityLabel(CashVisibility visibility) {
  switch (visibility) {
    case CashVisibility.publicToResidents:
      return 'Dapat dilihat warga';
    case CashVisibility.adminOnly:
      return 'Khusus pengurus';
  }
}

/// Mirrors `CashTransaction` in `packages/contracts/src/cash.ts`.
class CashTransaction {
  const CashTransaction({
    required this.id,
    required this.date,
    required this.category,
    required this.description,
    required this.amount,
    required this.type,
    required this.visibility,
    required this.recordedByName,
    required this.createdAt,
  });

  final String id;

  /// YYYY-MM-DD, matching the API's date-only contract.
  final String date;
  final String category;
  final String description;
  final int amount;
  final CashTransactionType type;
  final CashVisibility visibility;
  final String recordedByName;
  final DateTime createdAt;

  factory CashTransaction.fromJson(Map<String, dynamic> json) {
    return CashTransaction(
      id: json['id'] as String,
      date: json['date'] as String,
      category: json['category'] as String,
      description: json['description'] as String,
      amount: (json['amount'] as num).toInt(),
      type: CashTransactionType.fromApi(json['type']),
      visibility: CashVisibility.fromApi(json['visibility']),
      recordedByName: json['recordedByName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

/// Mirrors the ledger envelope returned by `GET /cash-transactions`:
/// the transaction list plus the period's opening/closing balances.
class CashLedgerSnapshot {
  const CashLedgerSnapshot({
    required this.items,
    required this.openingBalance,
    required this.totalIncome,
    required this.totalExpense,
    required this.closingBalance,
  });

  final List<CashTransaction> items;
  final int openingBalance;
  final int totalIncome;
  final int totalExpense;
  final int closingBalance;

  factory CashLedgerSnapshot.fromJson(Map<String, dynamic> json) {
    final items = json['items'];
    if (items is! List) {
      throw const FormatException('Cash ledger items are invalid.');
    }
    return CashLedgerSnapshot(
      items: items
          .map((item) => CashTransaction.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      openingBalance: (json['openingBalance'] as num).toInt(),
      totalIncome: (json['totalIncome'] as num).toInt(),
      totalExpense: (json['totalExpense'] as num).toInt(),
      closingBalance: (json['closingBalance'] as num).toInt(),
    );
  }
}
