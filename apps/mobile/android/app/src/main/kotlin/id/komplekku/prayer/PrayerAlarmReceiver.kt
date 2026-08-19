package id.komplekku.prayer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
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
        PrayerAlarmScheduler(context).recordFired(event)
        ContextCompat.startForegroundService(context, AdzanPlaybackService.playIntent(context, event))
    }

    companion object {
        const val ACTION_FIRE = "id.komplekku.action.PRAYER_ALARM"
        const val EXTRA_ID = "alarm_id"
        const val EXTRA_EPOCH_MILLIS = "epoch_millis"
        const val EXTRA_KIND = "kind"
        const val EXTRA_PRAYER_LABEL = "prayer_label"
    }
}
