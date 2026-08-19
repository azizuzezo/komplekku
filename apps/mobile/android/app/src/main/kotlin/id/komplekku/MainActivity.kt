package id.komplekku

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import id.komplekku.prayer.PrayerAlarmBridge

/**
 * Bridges what the in-app updater needs from Android and cannot get from
 * Dart: the running build's `versionCode`, a background-survivable download
 * of the update APK via [DownloadManager], and the system package-installer
 * intent.
 *
 * The download runs as a system-managed [DownloadManager] request rather than
 * inside the Dart isolate specifically so it keeps going when the screen locks
 * or the app is backgrounded — a plain in-process HTTP download stalls or
 * restarts under those conditions, which is the bug this replaces.
 *
 * Written as a small channel rather than pulling in extra pub packages — the
 * whole surface is a handful of calls, and this avoids adding dependencies
 * that would have to be fetched over the network.
 */
class MainActivity : FlutterActivity() {
    private val channelName = "id.komplekku/app_update"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        PrayerAlarmBridge.register(this, flutterEngine.dartExecutor.binaryMessenger)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "currentVersionCode" -> result.success(currentVersionCode())
                    "enqueueDownload" -> {
                        val url = call.argument<String>("url")
                        val fileName = call.argument<String>("fileName")
                        if (url.isNullOrBlank() || fileName.isNullOrBlank()) {
                            result.error(
                                "INVALID_ARGS",
                                "url and fileName are required.",
                                null,
                            )
                        } else {
                            enqueueDownload(url, fileName, result)
                        }
                    }
                    "queryDownload" -> {
                        val id = call.argument<Number>("id")?.toLong()
                        if (id == null) {
                            result.error("INVALID_ARGS", "id is required.", null)
                        } else {
                            result.success(queryDownload(id))
                        }
                    }
                    "installApk" -> {
                        val path = call.argument<String>("path")
                        if (path.isNullOrBlank()) {
                            result.error("INVALID_PATH", "APK path is required.", null)
                        } else {
                            installApk(path, result)
                        }
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun currentVersionCode(): Long {
        val info = packageManager.getPackageInfo(packageName, 0)
        return info.longVersionCode
    }

    /**
     * App-private external storage: no runtime permission needed, and the OS
     * clears it when the app is uninstalled so stale APKs cannot pile up.
     */
    private fun enqueueDownload(url: String, fileName: String, result: MethodChannel.Result) {
        try {
            val downloadManager =
                getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val request = DownloadManager.Request(Uri.parse(url))
                .setTitle("Pembaruan Komplekku")
                .setDestinationInExternalFilesDir(this, null, fileName)
                .setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED,
                )
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)
            result.success(downloadManager.enqueue(request))
        } catch (error: Exception) {
            result.error("DOWNLOAD_FAILED", error.message, null)
        }
    }

    /**
     * Reads the current state of a previously enqueued download straight from
     * [DownloadManager], so Dart can resume showing progress (or install
     * immediately if it already finished) no matter when it asks — including
     * after the app process was killed and relaunched.
     */
    private fun queryDownload(id: Long): Map<String, Any?> {
        val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val query = DownloadManager.Query().setFilterById(id)
        downloadManager.query(query).use { cursor ->
            if (!cursor.moveToFirst()) {
                return mapOf("status" to "NOT_FOUND")
            }
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            val bytesDownloaded = cursor.getLong(
                cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR),
            )
            val bytesTotal = cursor.getLong(
                cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES),
            )
            val localUri = cursor.getString(
                cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI),
            )
            return mapOf(
                "status" to statusName(status),
                "bytesDownloaded" to bytesDownloaded,
                "bytesTotal" to bytesTotal,
                "localPath" to localUri?.let { Uri.parse(it).path },
            )
        }
    }

    private fun statusName(status: Int): String = when (status) {
        DownloadManager.STATUS_PENDING -> "PENDING"
        DownloadManager.STATUS_RUNNING -> "RUNNING"
        DownloadManager.STATUS_PAUSED -> "PAUSED"
        DownloadManager.STATUS_SUCCESSFUL -> "SUCCESSFUL"
        DownloadManager.STATUS_FAILED -> "FAILED"
        else -> "UNKNOWN"
    }

    private fun installApk(path: String, result: MethodChannel.Result) {
        val file = File(path)
        if (!file.exists()) {
            result.error("FILE_MISSING", "Downloaded APK not found.", null)
            return
        }

        try {
            // Android forbids handing a raw file:// path to another app, so the
            // installer receives a content:// URI from our FileProvider.
            val uri: Uri = FileProvider.getUriForFile(
                this,
                "$packageName.fileprovider",
                file,
            )
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
            result.success(true)
        } catch (error: Exception) {
            result.error("INSTALL_FAILED", error.message, null)
        }
    }
}
