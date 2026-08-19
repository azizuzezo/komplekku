package id.komplekku.prayer

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build

class PrayerAlarmScheduler(private val context: Context) {
    private val alarmManager = context.getSystemService(AlarmManager::class.java)
    private val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)

    fun replaceSchedule(events: List<PrayerAlarmEvent>) {
        cancelEvents(readEvents())
        val futureEvents = events.filter { it.epochMillis > System.currentTimeMillis() }
        preferences.edit()
            .putString(EVENTS_KEY, PrayerAlarmEvent.encodeList(futureEvents))
            .remove(LAST_ERROR_KEY)
            .apply()
        futureEvents.forEach { schedule(it) }
    }

    fun cancelSchedule() {
        cancelEvents(readEvents())
        preferences.edit().remove(EVENTS_KEY).apply()
    }

    fun restoreSchedule() {
        val futureEvents = readEvents().filter { it.epochMillis > System.currentTimeMillis() }
        preferences.edit().putString(EVENTS_KEY, PrayerAlarmEvent.encodeList(futureEvents)).apply()
        futureEvents.forEach { schedule(it) }
    }

    fun recordFired(event: PrayerAlarmEvent) {
        val remaining = readEvents().filterNot { it.id == event.id }
        preferences.edit()
            .putString(EVENTS_KEY, PrayerAlarmEvent.encodeList(remaining))
            .putLong(LAST_FIRED_AT_KEY, System.currentTimeMillis())
            .putString(LAST_FIRED_KIND_KEY, event.kind.wireValue)
            .apply()
    }

    fun status(): Map<String, Any?> = mapOf(
        "exactAlarmAllowed" to canScheduleExactAlarms(),
        "scheduledCount" to readEvents().count { it.epochMillis > System.currentTimeMillis() },
        "lastError" to preferences.getString(LAST_ERROR_KEY, null),
        "lastFiredAt" to preferences.getLong(LAST_FIRED_AT_KEY, 0L).takeIf { it > 0L },
        "lastFiredKind" to preferences.getString(LAST_FIRED_KIND_KEY, null),
    )

    fun canScheduleExactAlarms(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

    private fun schedule(event: PrayerAlarmEvent) {
        try {
            val operation = requireNotNull(
                pendingIntent(event, PendingIntent.FLAG_UPDATE_CURRENT),
            )
            if (canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, event.epochMillis, operation)
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, event.epochMillis, operation)
            }
        } catch (error: Exception) {
            preferences.edit().putString(LAST_ERROR_KEY, error.message ?: error.javaClass.simpleName).apply()
        }
    }

    private fun cancelEvents(events: List<PrayerAlarmEvent>) {
        events.forEach { event ->
            val operation = pendingIntent(event, PendingIntent.FLAG_NO_CREATE)
            if (operation != null) alarmManager.cancel(operation)
        }
    }

    private fun pendingIntent(event: PrayerAlarmEvent, lookupFlag: Int): PendingIntent? {
        val intent = Intent(context, PrayerAlarmReceiver::class.java).apply {
            action = PrayerAlarmReceiver.ACTION_FIRE
            data = Uri.parse("komplekku://prayer-alarm/${event.id}")
            putExtra(PrayerAlarmReceiver.EXTRA_ID, event.id)
            putExtra(PrayerAlarmReceiver.EXTRA_EPOCH_MILLIS, event.epochMillis)
            putExtra(PrayerAlarmReceiver.EXTRA_KIND, event.kind.wireValue)
            putExtra(PrayerAlarmReceiver.EXTRA_PRAYER_LABEL, event.prayerLabel)
        }
        return PendingIntent.getBroadcast(
            context,
            event.id,
            intent,
            lookupFlag or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun readEvents(): List<PrayerAlarmEvent> = try {
        PrayerAlarmEvent.decodeList(preferences.getString(EVENTS_KEY, null))
    } catch (error: Exception) {
        preferences.edit().putString(LAST_ERROR_KEY, "Jadwal tersimpan rusak: ${error.message}").apply()
        emptyList()
    }

    companion object {
        private const val PREFERENCES = "komplekku_prayer_alarm"
        private const val EVENTS_KEY = "events"
        private const val LAST_ERROR_KEY = "last_error"
        private const val LAST_FIRED_AT_KEY = "last_fired_at"
        private const val LAST_FIRED_KIND_KEY = "last_fired_kind"
    }
}
