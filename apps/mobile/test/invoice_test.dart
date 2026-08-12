import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/invoice/domain/invoice.dart';
import 'package:komplekku/features/invoice/domain/payment.dart';

void main() {
  group('Invoice', () {
    test('parses an unpaid invoice', () {
      final invoice = Invoice.fromJson({
        'id': 'invoice-1',
        'duesTypeId': 'dues-type-1',
        'duesTypeName': 'Iuran Bulanan',
        'period': '2026-08',
        'amount': 150000,
        'dueDate': '2026-08-10',
        'status': 'UNPAID',
        'houseCode': 'A-12',
        'householdDisplayName': 'Keluarga Budi',
        'waivedReason': null,
        'paidAt': null,
        'receiptNumber': null,
        'createdAt': '2026-08-01T00:00:00.000Z',
      });

      expect(invoice.status, InvoiceStatus.unpaid);
      expect(invoice.canSubmitPayment, isTrue);
      expect(invoice.paidAt, isNull);
    });

    test('parses a paid invoice with receipt details', () {
      final invoice = Invoice.fromJson({
        'id': 'invoice-2',
        'duesTypeId': 'dues-type-1',
        'duesTypeName': 'Iuran Bulanan',
        'period': '2026-07',
        'amount': 150000,
        'dueDate': '2026-07-10',
        'status': 'PAID',
        'houseCode': 'A-12',
        'householdDisplayName': 'Keluarga Budi',
        'waivedReason': null,
        'paidAt': '2026-07-05T09:30:00.000Z',
        'receiptNumber': 'KWT-0001',
        'createdAt': '2026-07-01T00:00:00.000Z',
      });

      expect(invoice.status, InvoiceStatus.paid);
      expect(invoice.canSubmitPayment, isFalse);
      expect(invoice.paidAt, DateTime.parse('2026-07-05T09:30:00.000Z'));
      expect(invoice.receiptNumber, 'KWT-0001');
    });

    test('throws a FormatException for an unsupported status', () {
      expect(
        () => Invoice.fromJson({
          'id': 'invoice-3',
          'duesTypeId': 'dues-type-1',
          'duesTypeName': 'Iuran Bulanan',
          'period': '2026-08',
          'amount': 150000,
          'dueDate': '2026-08-10',
          'status': 'SOMETHING_NEW',
          'houseCode': 'A-12',
          'householdDisplayName': 'Keluarga Budi',
          'waivedReason': null,
          'paidAt': null,
          'receiptNumber': null,
          'createdAt': '2026-08-01T00:00:00.000Z',
        }),
        throwsFormatException,
      );
    });
  });

  group('Payment', () {
    test('parses a pending payment', () {
      final payment = Payment.fromJson({
        'id': 'payment-1',
        'invoiceId': 'invoice-1',
        'duesTypeName': 'Iuran Bulanan',
        'period': '2026-08',
        'amount': 150000,
        'paidAt': '2026-08-05',
        'note': 'Transfer BCA an. Budi, ref 123456.',
        'status': 'PENDING',
        'submittedByName': 'Budi',
        'houseCode': 'A-12',
        'householdDisplayName': 'Keluarga Budi',
        'verifiedByName': null,
        'verifiedAt': null,
        'rejectionReason': null,
        'receiptNumber': null,
        'createdAt': '2026-08-05T10:00:00.000Z',
      });

      expect(payment.status, PaymentStatus.pending);
      expect(payment.verifiedAt, isNull);
    });

    test('parses a rejected payment with a reason', () {
      final payment = Payment.fromJson({
        'id': 'payment-2',
        'invoiceId': 'invoice-1',
        'duesTypeName': 'Iuran Bulanan',
        'period': '2026-08',
        'amount': 150000,
        'paidAt': '2026-08-05',
        'note': 'Transfer BCA an. Budi, ref 123456.',
        'status': 'REJECTED',
        'submittedByName': 'Budi',
        'houseCode': 'A-12',
        'householdDisplayName': 'Keluarga Budi',
        'verifiedByName': 'Bendahara Sari',
        'verifiedAt': '2026-08-06T08:00:00.000Z',
        'rejectionReason': 'Jumlah tidak sesuai tagihan.',
        'receiptNumber': null,
        'createdAt': '2026-08-05T10:00:00.000Z',
      });

      expect(payment.status, PaymentStatus.rejected);
      expect(payment.rejectionReason, 'Jumlah tidak sesuai tagihan.');
      expect(payment.verifiedByName, 'Bendahara Sari');
    });

    test('throws a FormatException for an unsupported status', () {
      expect(
        () => Payment.fromJson({
          'id': 'payment-3',
          'invoiceId': 'invoice-1',
          'duesTypeName': 'Iuran Bulanan',
          'period': '2026-08',
          'amount': 150000,
          'paidAt': '2026-08-05',
          'note': 'Transfer BCA an. Budi, ref 123456.',
          'status': 'UNKNOWN',
          'submittedByName': 'Budi',
          'houseCode': 'A-12',
          'householdDisplayName': 'Keluarga Budi',
          'verifiedByName': null,
          'verifiedAt': null,
          'rejectionReason': null,
          'receiptNumber': null,
          'createdAt': '2026-08-05T10:00:00.000Z',
        }),
        throwsFormatException,
      );
    });
  });
}
