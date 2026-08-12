import { z } from "zod";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const DEFAULT_COMMUNITY_COORDINATES: Coordinates = {
  latitude: -6.509706886903904,
  longitude: 106.77295885896154,
};

export type PrayerName = "subuh" | "syuruq" | "dzuhur" | "ashar" | "maghrib" | "isya";

export interface PrayerSchedule {
  subuh: string;
  syuruq: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  nextPrayer: PrayerName;
  nextPrayerTime: string;
  secondsToNextPrayer: number;
}

export type AdzanStateKind = "IDLE" | "ADZAN" | "POST_ADZAN_GAP" | "IQOMAH_COUNTDOWN" | "SHOLAT";

export interface AdzanState {
  kind: AdzanStateKind;
  activePrayer: PrayerName | null;
  adzanTimeMs: number | null;
  gapSecondsRemaining: number;
  iqomahSecondsRemaining: number;
}

export const prayerScheduleSchema = z.object({
  subuh: z.string(),
  syuruq: z.string(),
  dzuhur: z.string(),
  ashar: z.string(),
  maghrib: z.string(),
  isya: z.string(),
  nextPrayer: z.enum(["subuh", "syuruq", "dzuhur", "ashar", "maghrib", "isya"]),
  nextPrayerTime: z.string(),
  secondsToNextPrayer: z.number(),
});

/**
 * Calculates prayer times for a given latitude, longitude, and date using standard Indonesian Kemenag formula parameters.
 */
export function calculatePrayerTimes(
  coords: Coordinates = DEFAULT_COMMUNITY_COORDINATES,
  date: Date = new Date(),
): Record<PrayerName, Date> {
  const d = new Date(date);
  const lat = coords.latitude;
  const lng = coords.longitude;
  const tz = 7; // WIB (Asia/Jakarta = UTC+7)

  // Day of year
  const startOfYear = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Declination & Equation of Time (BIMAS Islam / Kemenag astronomical formula)
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eqT = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
  const decl = 23.45 * Math.sin((2 * Math.PI * (dayOfYear - 80)) / 365); // degrees

  // Solar noon (Dzuhur) in UTC+7 hours
  const noon = 12 + (tz * 15 - lng) / 15 - eqT / 60;

  const rad = Math.PI / 180;
  const latR = lat * rad;
  const declR = decl * rad;

  const haForAngle = (angleDeg: number) => {
    const angleR = angleDeg * rad;
    const cosHA =
      (Math.sin(angleR) - Math.sin(latR) * Math.sin(declR)) / (Math.cos(latR) * Math.cos(declR));
    if (cosHA > 1) return 0;
    if (cosHA < -1) return 12;
    return (Math.acos(cosHA) * 180) / Math.PI / 15;
  };

  // Subuh (-20 deg), Syuruq (-0.833 deg), Maghrib (-0.833 deg), Isya (-18 deg)
  const subuhHA = haForAngle(-20);
  const syuruqHA = haForAngle(-0.833);
  const maghribHA = haForAngle(-0.833);
  const isyaHA = haForAngle(-18);

  // Ashar: Shadow length = 1 + tan(lat - decl)
  const shadowLen = 1 + Math.tan(Math.abs(latR - declR));
  const asharAltR = Math.atan(1 / shadowLen);
  const asharHA = haForAngle(asharAltR / rad);

  const makePrayerDate = (hoursFloat: number) => {
    const result = new Date(d);
    const totalMinutes = Math.round(hoursFloat * 60) + 2; // +2 mins Ihtiyati
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    result.setHours(h, m, 0, 0);
    return result;
  };

  return {
    subuh: makePrayerDate(noon - subuhHA),
    syuruq: makePrayerDate(noon - syuruqHA),
    dzuhur: makePrayerDate(noon),
    ashar: makePrayerDate(noon + asharHA),
    maghrib: makePrayerDate(noon + maghribHA),
    isya: makePrayerDate(noon + isyaHA),
  };
}

/**
 * Computes the Adzan & Iqomah state given current time and prayer times.
 * - 5 minutes post-Adzan gap
 * - 6 minutes Iqomah countdown (total 11 mins from Adzan)
 */
export function getAdzanState(now: Date, prayerTimes: Record<PrayerName, Date>): AdzanState {
  const nowMs = now.getTime();
  const POST_ADZAN_GAP_MS = 5 * 60 * 1000;
  const IQOMAH_COUNTDOWN_MS = 6 * 60 * 1000;
  const TOTAL_WINDOW_MS = POST_ADZAN_GAP_MS + IQOMAH_COUNTDOWN_MS;

  const prayers: PrayerName[] = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];

  for (const prayer of prayers) {
    const pTimeMs = prayerTimes[prayer].getTime();
    const elapsed = nowMs - pTimeMs;

    if (elapsed >= 0 && elapsed < TOTAL_WINDOW_MS) {
      if (elapsed < 30 * 1000) {
        return {
          kind: "ADZAN",
          activePrayer: prayer,
          adzanTimeMs: pTimeMs,
          gapSecondsRemaining: Math.ceil((POST_ADZAN_GAP_MS - elapsed) / 1000),
          iqomahSecondsRemaining: 360,
        };
      } else if (elapsed < POST_ADZAN_GAP_MS) {
        return {
          kind: "POST_ADZAN_GAP",
          activePrayer: prayer,
          adzanTimeMs: pTimeMs,
          gapSecondsRemaining: Math.ceil((POST_ADZAN_GAP_MS - elapsed) / 1000),
          iqomahSecondsRemaining: 360,
        };
      } else {
        const iqomahElapsed = elapsed - POST_ADZAN_GAP_MS;
        const iqomahRemaining = Math.max(
          0,
          Math.ceil((IQOMAH_COUNTDOWN_MS - iqomahElapsed) / 1000),
        );
        return {
          kind: "IQOMAH_COUNTDOWN",
          activePrayer: prayer,
          adzanTimeMs: pTimeMs,
          gapSecondsRemaining: 0,
          iqomahSecondsRemaining: iqomahRemaining,
        };
      }
    }
  }

  return {
    kind: "IDLE",
    activePrayer: null,
    adzanTimeMs: null,
    gapSecondsRemaining: 0,
    iqomahSecondsRemaining: 0,
  };
}

export function formatTime24(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}.${m}`;
}

export function formatDurationMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
