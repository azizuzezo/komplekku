/// Mirrors the response of `GET /finance/dashboard` /
/// `packages/contracts/src/finance-dashboard.ts`.
class FinanceDashboard {
  const FinanceDashboard({
    required this.outstandingInvoiceCount,
    required this.outstandingInvoiceAmount,
    required this.pendingVerificationCount,
    required this.collectedThisMonth,
    required this.cashBalance,
  });

  final int outstandingInvoiceCount;
  final int outstandingInvoiceAmount;
  final int pendingVerificationCount;
  final int collectedThisMonth;
  final int cashBalance;

  factory FinanceDashboard.fromJson(Map<String, dynamic> json) {
    return FinanceDashboard(
      outstandingInvoiceCount: (json['outstandingInvoiceCount'] as num).toInt(),
      outstandingInvoiceAmount:
          (json['outstandingInvoiceAmount'] as num).toInt(),
      pendingVerificationCount:
          (json['pendingVerificationCount'] as num).toInt(),
      collectedThisMonth: (json['collectedThisMonth'] as num).toInt(),
      cashBalance: (json['cashBalance'] as num).toInt(),
    );
  }
}
