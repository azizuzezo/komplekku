package id.komplekku.prayer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import androidx.core.content.ContextCompat

class PrayerAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_FIRE) return
        val kindValue = intent.getStringExtra(EXTRA_KIND) ?: return
        val prayerLabel = intent.getStringExtra(EXTRA_PRAYER_LABEL) ?: return
        val event = try {
            PrayerAlarmEvent(
                id = intent.getIntExtra(EXTRA_ID, 0),
                epochMillis = intent.getLongExtra(EXTRA_EPOCH_MILLIS, 0L),
                kind = PrayerAlarmKind.fromWire(kindValue),
                prayerLabel = prayerLabel,
            )
        } catch (_: IllegalArgumentException) {
            return
        }

        // Some OEMs re-enter Doze right at the edge of waking the receiver; a
        // short wake lock keeps the CPU up long enough to reliably hand off to
        // the foreground service (or the fallback notification) below.
        val wakeLock = (context.getSystemService(Context.POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Komplekku:PrayerAlarmReceiver")
        wakeLock.acquire(WAKE_LOCK_MILLIS)
        try {
            deliver(context, event)
        } finally {
            if (wakeLock.isHeld) wakeLock.release()
        }
    }

    /**
     * Android 12+ can throw `ForegroundServiceStartNotAllowedException` when a
     * background-started foreground service is requested after the app's
     * "recently used" exemption has lapsed — exactly the "adzan is silent
     * unless the app was just opened" symptom this guards against. Previously
     * this call had no try/catch, so that exception crashed the broadcast
     * silently: no sound, no notification, nothing. Now a failure falls back
     * to [AdzanFallbackNotifier], a plain notification that carries its own
     * sound and does not depend on the foreground-service background-start
     * exemption at all.
     */
    private fun deliver(context: Context, event: PrayerAlarmEvent) {
        val scheduler = PrayerAlarmScheduler(context)
        try {
            ContextCompat.startForegroundService(context, AdzanPlaybackService.playIntent(context, event))
            scheduler.recordFired(event, delivered = true)
        } catch (error: Exception) {
            scheduler.recordFired(
                event,
                delivered = false,
                error = error.message ?: error.javaClass.simpleName,
            )
            AdzanFallbackNotifier.notify(context, event)
        }
    }

    companion object {
        const val ACTION_FIRE = "id.komplekku.action.PRAYER_ALARM"
        const val EXTRA_ID = "alarm_id"
        const val EXTRA_EPOCH_MILLIS = "epoch_millis"
        const val EXTRA_KIND = "kind"
        const val EXTRA_PRAYER_LABEL = "prayer_label"
        private const val WAKE_LOCK_MILLIS = 20_000L
    }
}
