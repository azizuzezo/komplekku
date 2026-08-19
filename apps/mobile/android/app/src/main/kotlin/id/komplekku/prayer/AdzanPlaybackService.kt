package id.komplekku.prayer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import id.komplekku.R

class AdzanPlaybackService : Service() {
    private var player: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopPlayback()
            return START_NOT_STICKY
        }

        val kind = try {
            PrayerAlarmKind.fromWire(intent?.getStringExtra(EXTRA_KIND) ?: return START_NOT_STICKY)
        } catch (_: IllegalArgumentException) {
            return START_NOT_STICKY
        }
        val prayerLabel = intent.getStringExtra(EXTRA_PRAYER_LABEL) ?: "Shalat"
        startForeground(NOTIFICATION_ID, buildNotification(kind, prayerLabel))
        startPlayback(kind)
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        releaseResources()
        super.onDestroy()
    }

    private fun startPlayback(kind: PrayerAlarmKind) {
        releaseResources()
        wakeLock = (getSystemService(POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Komplekku:PrayerPlayback")
            .apply { acquire(MAX_WAKE_LOCK_MILLIS) }

        val resource = if (kind == PrayerAlarmKind.ADZAN) R.raw.adzan else R.raw.iqomah
        val descriptor = resources.openRawResourceFd(resource)
        player = MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build(),
            )
            setDataSource(descriptor.fileDescriptor, descriptor.startOffset, descriptor.length)
            setOnCompletionListener { stopPlayback() }
            setOnErrorListener { _, _, _ ->
                stopPlayback()
                true
            }
            prepare()
            start()
        }
        descriptor.close()
    }

    private fun buildNotification(kind: PrayerAlarmKind, prayerLabel: String): android.app.Notification {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                "Pemutaran adzan dan iqomah",
                NotificationManager.IMPORTANCE_LOW,
            ).apply { setSound(null, null) },
        )
        val stopIntent = PendingIntent.getService(
            this,
            0,
            Intent(this, AdzanPlaybackService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val title = if (kind == PrayerAlarmKind.ADZAN) "Adzan $prayerLabel" else "Iqomah $prayerLabel"
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_komplekku)
            .setContentTitle(title)
            .setContentText("Komplekku sedang memutar ${kind.wireValue} otomatis.")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .addAction(0, "Hentikan", stopIntent)
            .build()
    }

    private fun stopPlayback() {
        releaseResources()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun releaseResources() {
        player?.run {
            if (isPlaying) stop()
            reset()
            release()
        }
        player = null
        wakeLock?.takeIf { it.isHeld }?.release()
        wakeLock = null
    }

    companion object {
        private const val CHANNEL_ID = "komplekku_prayer_playback_v1"
        private const val NOTIFICATION_ID = 8_170
        private const val ACTION_STOP = "id.komplekku.action.STOP_PRAYER_AUDIO"
        private const val EXTRA_KIND = "kind"
        private const val EXTRA_PRAYER_LABEL = "prayer_label"
        private const val MAX_WAKE_LOCK_MILLIS = 15 * 60 * 1000L

        fun playIntent(context: Context, event: PrayerAlarmEvent): Intent =
            Intent(context, AdzanPlaybackService::class.java)
                .putExtra(EXTRA_KIND, event.kind.wireValue)
                .putExtra(EXTRA_PRAYER_LABEL, event.prayerLabel)
    }
}
