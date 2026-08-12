/// Small formatting helpers shared by the Transparansi Kas screen, mirroring
/// the Indonesian Rupiah/date formatting used on web
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

String todayDateString() {
  final now = DateTime.now();
  final month = now.month.toString().padLeft(2, '0');
  final day = now.day.toString().padLeft(2, '0');
  return '${now.year}-$month-$day';
}

/// Formats a Riverpod month input (YYYY-MM) into e.g. `Agustus 2026`.
String formatPeriodLabel(String period) {
  final parts = period.split('-');
  if (parts.length != 2) return period;
  const monthsLong = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  final month = int.tryParse(parts[1]);
  if (month == null || month < 1 || month > 12) return period;
  return '${monthsLong[month - 1]} ${parts[0]}';
}

String currentPeriod() {
  final now = DateTime.now();
  final month = now.month.toString().padLeft(2, '0');
  return '${now.year}-$month';
}

/// Shifts a YYYY-MM period by [delta] months (negative moves back).
String shiftPeriod(String period, int delta) {
  final parts = period.split('-');
  if (parts.length != 2) return period;
  var year = int.tryParse(parts[0]) ?? DateTime.now().year;
  var month = (int.tryParse(parts[1]) ?? 1) + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return '$year-${month.toString().padLeft(2, '0')}';
}
