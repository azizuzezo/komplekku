package id.komplekku.prayer

import org.json.JSONArray
import org.json.JSONObject

enum class PrayerAlarmKind(val wireValue: String) {
    ADZAN("adzan"),
    IQOMAH("iqomah");

    companion object {
        fun fromWire(value: String): PrayerAlarmKind =
            entries.firstOrNull { it.wireValue == value }
                ?: throw IllegalArgumentException("Unknown prayer alarm kind: $value")
    }
}

data class PrayerAlarmEvent(
    val id: Int,
    val epochMillis: Long,
    val kind: PrayerAlarmKind,
    val prayerLabel: String,
) {
    fun toJson(): JSONObject = JSONObject()
        .put("id", id)
        .put("epochMillis", epochMillis)
        .put("kind", kind.wireValue)
        .put("prayerLabel", prayerLabel)

    companion object {
        fun stableId(epochMillis: Long, prayer: String, kind: PrayerAlarmKind): Int {
            val mixed = epochMillis xor (prayer.lowercase().hashCode().toLong() shl 21) xor kind.ordinal.toLong()
            return ((mixed xor (mixed ushr 32)).toInt() and Int.MAX_VALUE)
        }

        fun encodeList(events: List<PrayerAlarmEvent>): String =
            JSONArray().apply { events.forEach { put(it.toJson()) } }.toString()

        fun decodeList(value: String?): List<PrayerAlarmEvent> {
            if (value.isNullOrBlank()) return emptyList()
            val array = JSONArray(value)
            return buildList {
                for (index in 0 until array.length()) {
                    val item = array.getJSONObject(index)
                    add(
                        PrayerAlarmEvent(
                            id = item.getInt("id"),
                            epochMillis = item.getLong("epochMillis"),
                            kind = PrayerAlarmKind.fromWire(item.getString("kind")),
                            prayerLabel = item.getString("prayerLabel"),
                        ),
                    )
                }
            }
        }
    }
}
