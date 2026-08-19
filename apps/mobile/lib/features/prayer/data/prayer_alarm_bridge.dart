import 'package:flutter/services.dart';

enum PrayerAlarmKind { adzan, iqomah }

class PrayerAlarmEvent {
  const PrayerAlarmEvent({
    required this.id,
    required this.epochMillis,
    required this.kind,
    required this.prayerLabel,
  });

  final int id;
  final int epochMillis;
  final PrayerAlarmKind kind;
  final String prayerLabel;

  Map<String, Object> toMap() => {
    'id': id,
    'epochMillis': epochMillis,
    'kind': kind.name,
    'prayerLabel': prayerLabel,
  };
}

class PrayerAlarmStatus {
  const PrayerAlarmStatus({
    required this.exactAlarmAllowed,
    required this.scheduledCount,
    this.lastError,
    this.lastFiredAt,
    this.lastFiredKind,
  });

  final bool exactAlarmAllowed;
  final int scheduledCount;
  final String? lastError;
  final int? lastFiredAt;
  final String? lastFiredKind;

  factory PrayerAlarmStatus.fromMap(Map<Object?, Object?> map) {
    return PrayerAlarmStatus(
      exactAlarmAllowed: map['exactAlarmAllowed'] as bool? ?? false,
      scheduledCount: (map['scheduledCount'] as num?)?.toInt() ?? 0,
      lastError: map['lastError'] as String?,
      lastFiredAt: (map['lastFiredAt'] as num?)?.toInt(),
      lastFiredKind: map['lastFiredKind'] as String?,
    );
  }
}

class PrayerAlarmBridge {
  PrayerAlarmBridge({MethodChannel? channel})
    : _channel = channel ?? const MethodChannel('id.komplekku/prayer_alarm');

  final MethodChannel _channel;

  Future<PrayerAlarmStatus> replaceSchedule(List<PrayerAlarmEvent> events) async {
    final response = await _channel.invokeMapMethod<Object?, Object?>(
      'replaceSchedule',
      {'events': events.map((event) => event.toMap()).toList(growable: false)},
    );
    return PrayerAlarmStatus.fromMap(response ?? const {});
  }

  Future<void> cancelSchedule() async {
    await _channel.invokeMethod<void>('cancelSchedule');
  }

  Future<PrayerAlarmStatus> status() async {
    final response = await _channel.invokeMapMethod<Object?, Object?>('status');
    return PrayerAlarmStatus.fromMap(response ?? const {});
  }

  Future<void> openExactAlarmSettings() async {
    await _channel.invokeMethod<void>('openExactAlarmSettings');
  }

  /// Prompts for exemption from Doze/App Standby battery throttling, which
  /// OEM battery managers (MIUI, ColorOS, One UI) apply aggressively to
  /// backgrounded apps regardless of how the adzan alarm was scheduled. A
  /// no-op once already granted.
  Future<void> requestIgnoreBatteryOptimizations() async {
    await _channel.invokeMethod<void>('requestIgnoreBatteryOptimizations');
  }

  Future<PrayerAlarmStatus> scheduleDiagnostic({int delaySeconds = 20}) async {
    final response = await _channel.invokeMapMethod<Object?, Object?>(
      'scheduleDiagnostic',
      {'delaySeconds': delaySeconds},
    );
    return PrayerAlarmStatus.fromMap(response ?? const {});
  }
}
