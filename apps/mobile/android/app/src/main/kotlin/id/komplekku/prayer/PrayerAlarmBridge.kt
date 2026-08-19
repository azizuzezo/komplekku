package id.komplekku.prayer

import android.app.Activity
import android.content.pm.ApplicationInfo
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodChannel

object PrayerAlarmBridge {
    private const val CHANNEL = "id.komplekku/prayer_alarm"

    fun register(activity: Activity, messenger: BinaryMessenger) {
        val scheduler = PrayerAlarmScheduler(activity.applicationContext)
        MethodChannel(messenger, CHANNEL).setMethodCallHandler { call, result ->
            try {
                when (call.method) {
                    "replaceSchedule" -> {
                        scheduler.replaceSchedule(parseEvents(call.argument<List<*>>("events")))
                        result.success(scheduler.status())
                    }
                    "cancelSchedule" -> {
                        scheduler.cancelSchedule()
                        result.success(true)
                    }
                    "status" -> result.success(scheduler.status())
                    "openExactAlarmSettings" -> {
                        activity.startActivity(
                            Intent(
                                Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                                Uri.parse("package:${activity.packageName}"),
                            ),
                        )
                        result.success(true)
                    }
                    "requestIgnoreBatteryOptimizations" -> {
                        requestIgnoreBatteryOptimizations(activity)
                        result.success(true)
                    }
                    "scheduleDiagnostic" -> {
                        val isDebuggable =
                            activity.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
                        if (!isDebuggable) {
                            result.error("NOT_AVAILABLE", "Diagnostic scheduling is debug-only.", null)
                        } else {
                            val delaySeconds = call.argument<Int>("delaySeconds") ?: 20
                            val now = System.currentTimeMillis() + 5_000L
                            val events = listOf(
                                PrayerAlarmEvent(
                                    PrayerAlarmEvent.stableId(now, "diagnostic", PrayerAlarmKind.ADZAN),
                                    now,
                                    PrayerAlarmKind.ADZAN,
                                    "Diagnostik",
                                ),
                                PrayerAlarmEvent(
                                    PrayerAlarmEvent.stableId(
                                        now + delaySeconds * 1_000L,
                                        "diagnostic",
                                        PrayerAlarmKind.IQOMAH,
                                    ),
                                    now + delaySeconds * 1_000L,
                                    PrayerAlarmKind.IQOMAH,
                                    "Diagnostik",
                                ),
                            )
                            scheduler.replaceSchedule(events)
                            result.success(scheduler.status())
                        }
                    }
                    else -> result.notImplemented()
                }
            } catch (error: Exception) {
                result.error("PRAYER_ALARM_ERROR", error.message, null)
            }
        }
    }

    /**
     * OEM battery managers (MIUI, ColorOS, FuntouchOS, One UI — common on
     * Indonesian devices) kill backgrounded processes outright regardless of
     * how the alarm was scheduled; this exemption is the only in-app lever
     * against that. A no-op once already granted.
     */
    private fun requestIgnoreBatteryOptimizations(activity: Activity) {
        val powerManager = activity.getSystemService(PowerManager::class.java)
        if (powerManager.isIgnoringBatteryOptimizations(activity.packageName)) return
        activity.startActivity(
            Intent(
                Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                Uri.parse("package:${activity.packageName}"),
            ),
        )
    }

    private fun parseEvents(items: List<*>?): List<PrayerAlarmEvent> {
        requireNotNull(items) { "events is required" }
        return items.map { raw ->
            val item = raw as? Map<*, *> ?: error("Invalid prayer event")
            val epochMillis = (item["epochMillis"] as? Number)?.toLong()
                ?: error("epochMillis is required")
            val kind = PrayerAlarmKind.fromWire(item["kind"] as? String ?: error("kind is required"))
            val prayerLabel = item["prayerLabel"] as? String ?: error("prayerLabel is required")
            val id = (item["id"] as? Number)?.toInt()
                ?: PrayerAlarmEvent.stableId(epochMillis, prayerLabel, kind)
            PrayerAlarmEvent(id, epochMillis, kind, prayerLabel)
        }
    }
}
