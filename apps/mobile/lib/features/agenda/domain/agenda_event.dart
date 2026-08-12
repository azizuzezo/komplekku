class AgendaEvent {
  const AgendaEvent({
    required this.id,
    required this.title,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.location,
    required this.description,
    required this.organizer,
  });

  final String id;
  final String title;

  /// YYYY-MM-DD, matching the API's date-only contract.
  final String date;

  /// HH:mm local wall-clock time, matching the API's time-only contract.
  final String startTime;
  final String endTime;
  final String location;
  final String description;
  final String organizer;

  factory AgendaEvent.fromJson(Map<String, dynamic> json) {
    return AgendaEvent(
      id: json['id'] as String,
      title: json['title'] as String,
      date: json['date'] as String,
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      location: json['location'] as String,
      description: json['description'] as String,
      organizer: json['organizer'] as String,
    );
  }

  String get dateLabel {
    final parts = date.split('-');
    if (parts.length != 3) return date;
    const months = [
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
    final month = int.tryParse(parts[1]);
    if (month == null || month < 1 || month > 12) return date;
    return '${int.parse(parts[2])} ${months[month - 1]} ${parts[0]}';
  }

  String get timeRangeLabel => '$startTime–$endTime';
}
