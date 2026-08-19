package id.komplekku

import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

/**
 * Bridges the three things the in-app updater needs from Android and cannot
 * get from Dart: the running build's `versionCode`, a directory to download
 * into, and the system package-installer intent.
 *
 * Written as a small channel rather than pulling in extra pub packages — the
 * whole surface is three calls, and this avoids adding dependencies that would
 * have to be fetched over the network.
 */
class MainActivity : FlutterActivity() {
    private val channelName = "id.komplekku/app_update"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "currentVersionCode" -> result.success(currentVersionCode())
                    "downloadDirectory" -> result.success(downloadDirectory())
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
    private fun downloadDirectory(): String =
        (getExternalFilesDir(null) ?: filesDir).absolutePath

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
