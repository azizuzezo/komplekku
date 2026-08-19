package id.komplekku.prayer

import org.junit.Assert.assertEquals
import org.junit.Test

class PrayerAlarmContractTest {
    @Test
    fun stableAlarmIdSeparatesPrayerAndKind() {
        val epoch = 1_787_116_080_000L
        val adzan = PrayerAlarmEvent.stableId(epoch, "ashar", PrayerAlarmKind.ADZAN)
        val iqomah = PrayerAlarmEvent.stableId(epoch, "ashar", PrayerAlarmKind.IQOMAH)

        assertEquals(adzan, PrayerAlarmEvent.stableId(epoch, "ashar", PrayerAlarmKind.ADZAN))
        assert(adzan != iqomah)
    }

    @Test
    fun eventListRoundTripsThroughPersistedJson() {
        val events = listOf(
            PrayerAlarmEvent(101, 1_787_116_080_000L, PrayerAlarmKind.ADZAN, "Ashar"),
            PrayerAlarmEvent(102, 1_787_116_680_000L, PrayerAlarmKind.IQOMAH, "Ashar"),
        )

        assertEquals(events, PrayerAlarmEvent.decodeList(PrayerAlarmEvent.encodeList(events)))
    }
}
