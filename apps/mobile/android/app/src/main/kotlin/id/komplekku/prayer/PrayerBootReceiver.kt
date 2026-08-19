package id.komplekku.prayer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PrayerBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action in RESTORE_ACTIONS) PrayerAlarmScheduler(context).restoreSchedule()
    }

    companion object {
        private val RESTORE_ACTIONS = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
        )
    }
}
