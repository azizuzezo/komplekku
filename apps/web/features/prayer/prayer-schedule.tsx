"use client";

import {
  calculatePrayerTimes,
  DEFAULT_COMMUNITY_COORDINATES,
  formatTime24,
  type PrayerName,
} from "@komplekku/contracts";
import { Quote } from "lucide-react";
import { useMemo, useState } from "react";

const PRAYER_LABELS: Record<PrayerName, string> = {
  subuh: "Subuh",
  syuruq: "Terbit",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};

const PRAYER_SUBTITLES: Record<PrayerName, string> = {
  subuh: "Awali hari dengan kebaikan",
  syuruq: "Matahari terbit",
  dzuhur: "Waktu istirahat dan bersyukur",
  ashar: "Waktu terbaik untuk berdoa",
  maghrib: "Saatnya berbuka dan bersyukur",
  isya: "Tutup hari dengan mengingat Allah",
};

const PRAYER_ORDER: PrayerName[] = ["subuh", "syuruq", "dzuhur", "ashar", "maghrib", "isya"];

/** Syuruq is a sun position rather than a prayer, so the month table — which
 * exists to plan around the five daily prayers — leaves it out. */
const DAILY_PRAYERS: PrayerName[] = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];

const DAILY_QUOTE = {
  text: "Dirikanlah shalat, sesungguhnya shalat itu mencegah dari perbuatan keji dan mungkar.",
  source: "QS. Al-Ankabut: 45",
};

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("id-ID", { weekday: "short" });
const MONTH_FORMATTER = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

type ScheduleView = "today" | "month";

export function PrayerSchedule() {
  const [view, setView] = useState<ScheduleView>("today");

  // The schedule is arithmetic over the date, so a single "today" anchor is
  // enough — no clock tick needed here, the live countdown lives in PrayerCard.
  const today = useMemo(() => new Date(), []);
  const todayTimes = useMemo(
    () => calculatePrayerTimes(DEFAULT_COMMUNITY_COORDINATES, today),
    [today],
  );

  const monthDays = useMemo(() => {
    const dayCount = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
      return { date, times: calculatePrayerTimes(DEFAULT_COMMUNITY_COORDINATES, date) };
    });
  }, [today]);

  return (
    <section className="prayer-schedule" aria-label="Jadwal shalat">
      <div className="prayer-schedule__switcher" role="tablist">
        {(
          [
            ["today", "Hari ini"],
            ["month", "Bulanan"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            className={`prayer-schedule__tab${
              view === value ? " prayer-schedule__tab--active" : ""
            }`}
            onClick={() => setView(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "today" ? (
        <ol className="prayer-schedule__list">
          {PRAYER_ORDER.map((prayer) => (
            <li key={prayer}>
              <div>
                <p className="prayer-schedule__name">{PRAYER_LABELS[prayer]}</p>
                <p className="prayer-schedule__hint">{PRAYER_SUBTITLES[prayer]}</p>
              </div>
              <time dateTime={todayTimes[prayer].toISOString()}>
                {formatTime24(todayTimes[prayer])}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <div className="prayer-schedule__month">
          <h2>{MONTH_FORMATTER.format(today)}</h2>
          <div className="prayer-schedule__table-scroll">
            <table className="prayer-schedule__table">
              <thead>
                <tr>
                  <th scope="col">Tgl</th>
                  {DAILY_PRAYERS.map((prayer) => (
                    <th scope="col" key={prayer}>
                      {PRAYER_LABELS[prayer]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthDays.map(({ date, times }) => {
                  const isToday = date.getDate() === today.getDate();
                  return (
                    <tr key={date.toISOString()} aria-current={isToday ? "date" : undefined}>
                      <th scope="row">
                        {date.getDate()} {WEEKDAY_FORMATTER.format(date)}
                      </th>
                      {DAILY_PRAYERS.map((prayer) => (
                        <td key={prayer}>{formatTime24(times[prayer])}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <blockquote className="prayer-schedule__quote">
        <Quote size={18} aria-hidden="true" />
        <div>
          <p>{DAILY_QUOTE.text}</p>
          <cite>{DAILY_QUOTE.source}</cite>
        </div>
      </blockquote>
    </section>
  );
}
