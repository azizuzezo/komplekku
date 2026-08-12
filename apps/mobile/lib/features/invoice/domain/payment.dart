enum PaymentStatus {
  pending('PENDING'),
  verified('VERIFIED'),
  rejected('REJECTED');

  const PaymentStatus(this.apiValue);

  final String apiValue;

  static PaymentStatus fromApi(Object? value) {
    if (value is! String) {
      throw const FormatException('Payment status is invalid.');
    }
    for (final status in values) {
      if (status.apiValue == value) return status;
    }
    throw FormatException('Unsupported payment status: $value');
  }
}

String paymentStatusLabel(PaymentStatus status) {
  switch (status) {
    case PaymentStatus.pending:
      return 'Menunggu Verifikasi';
    case PaymentStatus.verified:
      return 'Terverifikasi';
    case PaymentStatus.rejected:
      return 'Ditolak';
  }
}

/// Mirrors `Payment` in `packages/contracts/src/payment.ts`.
class Payment {
  const Payment({
    required this.id,
    required this.invoiceId,
    required this.duesTypeName,
    required this.period,
    required this.amount,
    required this.paidAt,
    required this.note,
    required this.status,
    required this.submittedByName,
    required this.houseCode,
    required this.householdDisplayName,
    required this.verifiedByName,
    required this.verifiedAt,
    required this.rejectionReason,
    required this.receiptNumber,
    required this.createdAt,
  });

  final String id;
  final String invoiceId;
  final String duesTypeName;
  final String period;
  final int amount;

  /// YYYY-MM-DD, matching the API's date-only contract.
  final String paidAt;
  final String note;
  final PaymentStatus status;
  final String submittedByName;
  final String houseCode;
  final String householdDisplayName;
  final String? verifiedByName;
  final DateTime? verifiedAt;
  final String? rejectionReason;
  final String? receiptNumber;
  final DateTime createdAt;

  factory Payment.fromJson(Map<String, dynamic> json) {
    final verifiedAtValue = json['verifiedAt'];
    return Payment(
      id: json['id'] as String,
      invoiceId: json['invoiceId'] as String,
      duesTypeName: json['duesTypeName'] as String,
      period: json['period'] as String,
      amount: (json['amount'] as num).toInt(),
      paidAt: json['paidAt'] as String,
      note: json['note'] as String,
      status: PaymentStatus.fromApi(json['status']),
      submittedByName: json['submittedByName'] as String,
      houseCode: json['houseCode'] as String,
      householdDisplayName: json['householdDisplayName'] as String,
      verifiedByName: json['verifiedByName'] as String?,
      verifiedAt: verifiedAtValue == null
          ? null
          : DateTime.parse(verifiedAtValue as String),
      rejectionReason: json['rejectionReason'] as String?,
      receiptNumber: json['receiptNumber'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
