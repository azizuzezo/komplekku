enum InvoiceStatus {
  unpaid('UNPAID'),
  pendingVerification('PENDING_VERIFICATION'),
  paid('PAID'),
  overdue('OVERDUE'),
  waived('WAIVED');

  const InvoiceStatus(this.apiValue);

  final String apiValue;

  static InvoiceStatus fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Invoice status is invalid.');
    }
    for (final status in values) {
      if (status.apiValue == value) return status;
    }
    throw FormatException('Unsupported invoice status: $value');
  }
}

String invoiceStatusLabel(InvoiceStatus status) {
  switch (status) {
    case InvoiceStatus.unpaid:
      return 'Belum Dibayar';
    case InvoiceStatus.pendingVerification:
      return 'Menunggu Verifikasi';
    case InvoiceStatus.paid:
      return 'Lunas';
    case InvoiceStatus.overdue:
      return 'Terlambat';
    case InvoiceStatus.waived:
      return 'Dibebaskan';
  }
}

/// Mirrors `Invoice` in `packages/contracts/src/invoice.ts`.
class Invoice {
  const Invoice({
    required this.id,
    required this.duesTypeId,
    required this.duesTypeName,
    required this.period,
    required this.amount,
    required this.dueDate,
    required this.status,
    required this.houseCode,
    required this.householdDisplayName,
    required this.waivedReason,
    required this.paidAt,
    required this.receiptNumber,
    required this.createdAt,
  });

  final String id;
  final String duesTypeId;
  final String duesTypeName;
  final String period;
  final int amount;

  /// YYYY-MM-DD, matching the API's date-only contract.
  final String dueDate;
  final InvoiceStatus status;
  final String houseCode;
  final String householdDisplayName;
  final String? waivedReason;
  final DateTime? paidAt;
  final String? receiptNumber;
  final DateTime createdAt;

  bool get canSubmitPayment =>
      status == InvoiceStatus.unpaid || status == InvoiceStatus.overdue;

  factory Invoice.fromJson(Map<String, dynamic> json) {
    final paidAtValue = json['paidAt'];
    return Invoice(
      id: json['id'] as String,
      duesTypeId: json['duesTypeId'] as String,
      duesTypeName: json['duesTypeName'] as String,
      period: json['period'] as String,
      amount: (json['amount'] as num).toInt(),
      dueDate: json['dueDate'] as String,
      status: InvoiceStatus.fromApi(json['status']),
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      waivedReason: json['waivedReason'] as String?,
      paidAt: paidAtValue == null
          ? null
          : DateTime.parse(paidAtValue as String),
      receiptNumber: json['receiptNumber'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
