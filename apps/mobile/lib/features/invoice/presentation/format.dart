/// Small formatting helpers shared by the Iuran (invoice/payment) screens,
/// mirroring the Indonesian Rupiah/date formatting used on web
/// (`Intl.NumberFormat("id-ID")` / `toLocaleDateString("id-ID")`) without
/// pulling in the `intl` package.
String formatRupiah(int amount) {
  final isNegative = amount < 0;
  final digits = amount.abs().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write('.');
    buffer.write(digits[i]);
  }
  return '${isNegative ? '-' : ''}Rp$buffer';
}

const _monthsShort = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/// Formats a YYYY-MM-DD date-only string, e.g. `11 Agu 2026`.
String formatDateOnly(String value) {
  final parts = value.split('-');
  if (parts.length != 3) return value;
  final year = parts[0];
  final month = int.tryParse(parts[1]);
  final day = int.tryParse(parts[2]);
  if (month == null || day == null || month < 1 || month > 12) return value;
  return '$day ${_monthsShort[month - 1]} $year';
}

/// Formats a [DateTime] as `11 Agu 2026 · 14:05`.
String formatDateTime(DateTime value) {
  final local = value.toLocal();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  final datePart =
      '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')}';
  return '${formatDateOnly(datePart)} · $hour:$minute';
}

String todayDateString() {
  final now = DateTime.now();
  final month = now.month.toString().padLeft(2, '0');
  final day = now.day.toString().padLeft(2, '0');
  return '${now.year}-$month-$day';
}
