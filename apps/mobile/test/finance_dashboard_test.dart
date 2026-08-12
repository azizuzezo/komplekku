import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/finance_dashboard/domain/finance_dashboard.dart';

void main() {
  test('parses a finance dashboard snapshot', () {
    final dashboard = FinanceDashboard.fromJson({
      'outstandingInvoiceCount': 12,
      'outstandingInvoiceAmount': 1800000,
      'pendingVerificationCount': 3,
      'collectedThisMonth': 4500000,
      'cashBalance': 12500000,
    });

    expect(dashboard.outstandingInvoiceCount, 12);
    expect(dashboard.outstandingInvoiceAmount, 1800000);
    expect(dashboard.pendingVerificationCount, 3);
    expect(dashboard.collectedThisMonth, 4500000);
    expect(dashboard.cashBalance, 12500000);
  });

  test('handles a negative cash balance', () {
    final dashboard = FinanceDashboard.fromJson({
      'outstandingInvoiceCount': 0,
      'outstandingInvoiceAmount': 0,
      'pendingVerificationCount': 0,
      'collectedThisMonth': 0,
      'cashBalance': -250000,
    });

    expect(dashboard.cashBalance, -250000);
  });
}
