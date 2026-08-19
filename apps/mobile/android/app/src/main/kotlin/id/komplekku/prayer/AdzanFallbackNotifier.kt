package id.komplekku.prayer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import androidx.core.app.NotificationCompat
import id.komplekku.MainActivity
import id.komplekku.R

/**
 * Last-resort alert for when [AdzanPlaybackService] cannot be started in the
 * background (Android 12+'s foreground-service background-start restriction,
 * or an OEM battery manager blocking it outright). A plain notification with
 * its own attached sound is not subject to that restriction, so it is the one
 * path that still alerts the user when the nicer looping/stoppable playback
 * service is blocked from starting.
 */
object AdzanFallbackNotifier {
    private const val CHANNEL_ID = "komplekku_prayer_fallback_v1"
    private const val NOTIFICATION_ID_BASE = 8_200

    fun notify(context: Context, event: PrayerAlarmEvent) {
        val notificationManager = context.getSystemService(NotificationManager::class.java)
        ensureChannel(context, notificationManager)

        val contentIntent = PendingIntent.getActivity(
            context,
            event.id,
            Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val title = if (event.kind == PrayerAlarmKind.ADZAN) {
            "Adzan ${event.prayerLabel}"
        } else {
            "Iqomah ${event.prayerLabel}"
        }
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_komplekku)
            .setContentTitle(title)
            .setContentText("Waktunya ${event.kind.wireValue} ${event.prayerLabel}.")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .setFullScreenIntent(contentIntent, true)
            .build()
        notificationManager.notify(NOTIFICATION_ID_BASE + (event.id % 1000).let { if (it < 0) it + 1000 else it }, notification)
    }

    private fun ensureChannel(context: Context, notificationManager: NotificationManager) {
        if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) return
        val soundUri = Uri.parse("android.resource://${context.packageName}/${R.raw.adzan}")
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Peringatan adzan cadangan",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            setSound(
                soundUri,
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build(),
            )
            enableVibration(true)
        }
        notificationManager.createNotificationChannel(channel)
    }
}
