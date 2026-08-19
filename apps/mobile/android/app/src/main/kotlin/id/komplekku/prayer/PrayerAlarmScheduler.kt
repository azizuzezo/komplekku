package id.komplekku.prayer

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import id.komplekku.MainActivity

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

    /**
     * [delivered] distinguishes "the alarm fired" from "the adzan actually
     * played": before this, the receiver recorded a fire the instant the
     * broadcast arrived, so a foreground-service start blocked by the OS (see
     * [PrayerAlarmReceiver]) still looked like a healthy delivery in [status].
     */
    fun recordFired(event: PrayerAlarmEvent, delivered: Boolean, error: String? = null) {
        val remaining = readEvents().filterNot { it.id == event.id }
        val editor = preferences.edit()
            .putString(EVENTS_KEY, PrayerAlarmEvent.encodeList(remaining))
            .putLong(LAST_FIRED_AT_KEY, System.currentTimeMillis())
            .putString(LAST_FIRED_KIND_KEY, event.kind.wireValue)
            .putBoolean(LAST_FIRED_DELIVERED_KEY, delivered)
        if (error != null) editor.putString(LAST_ERROR_KEY, error)
        editor.apply()
    }

    fun status(): Map<String, Any?> = mapOf(
        "exactAlarmAllowed" to canScheduleExactAlarms(),
        "scheduledCount" to readEvents().count { it.epochMillis > System.currentTimeMillis() },
        "lastError" to preferences.getString(LAST_ERROR_KEY, null),
        "lastFiredAt" to preferences.getLong(LAST_FIRED_AT_KEY, 0L).takeIf { it > 0L },
        "lastFiredKind" to preferences.getString(LAST_FIRED_KIND_KEY, null),
        "lastFiredDelivered" to preferences.getBoolean(LAST_FIRED_DELIVERED_KEY, true),
    )

    fun canScheduleExactAlarms(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

    private fun schedule(event: PrayerAlarmEvent) {
        try {
            val operation = requireNotNull(
                pendingIntent(event, PendingIntent.FLAG_UPDATE_CURRENT),
            )
            if (canScheduleExactAlarms()) {
                // setAlarmClock is the strongest delivery guarantee AlarmManager
                // offers: the system treats it like a user-set alarm clock and
                // will not defer or batch it for Doze/App Standby, unlike
                // setExactAndAllowWhileIdle which OEM battery managers (MIUI,
                // ColorOS, FuntouchOS, One UI — common on Indonesian devices)
                // are known to throttle anyway once the app has been closed for
                // a while. Available since API 21, so this also helps Android 10.
                alarmManager.setAlarmClock(
                    AlarmManager.AlarmClockInfo(event.epochMillis, showIntent()),
                    operation,
                )
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, event.epochMillis, operation)
            }
        } catch (error: Exception) {
            preferences.edit().putString(LAST_ERROR_KEY, error.message ?: error.javaClass.simpleName).apply()
        }
    }

    private fun showIntent(): PendingIntent {
        val intent = Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
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
        private const val LAST_FIRED_DELIVERED_KEY = "last_fired_delivered"
    }
}
