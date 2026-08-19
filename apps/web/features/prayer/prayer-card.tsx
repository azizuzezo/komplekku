"use client";

import {
  calculatePrayerTimes,
  DEFAULT_COMMUNITY_COORDINATES,
  formatTime24,
  type PrayerName,
} from "@komplekku/contracts";
import { Clock3, CloudSun, Landmark, MapPin, MoonStar, Sun, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

const PRAYERS: Array<{ name: PrayerName; label: string; icon: typeof CloudSun }> = [
  { name: "subuh", label: "Subuh", icon: CloudSun },
  { name: "dzuhur", label: "Dzuhur", icon: Sun },
  { name: "ashar", label: "Ashar", icon: CloudSun },
  { name: "maghrib", label: "Maghrib", icon: Sunset },
  { name: "isya", label: "Isya", icon: MoonStar },
];

function countdown(target: Date, now: Date) {
  const seconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${rest}`;
}

export function PrayerCard({ variant = "detail" }: { variant?: "home" | "detail" }) {
  const [now, setNow] = useState(() => new Date());
  const [coordinates, setCoordinates] = useState(DEFAULT_COMMUNITY_COORDINATES);
  const [locationLabel, setLocationLabel] = useState("Billabong");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationLabel("Lokasi saya");
      },
      () => undefined,
      { timeout: 5000 },
    );
  }, []);

  const times = calculatePrayerTimes(coordinates, now);
  let next = PRAYERS.find((item) => times[item.name].getTime() > now.getTime());
  let nextTime = next ? times[next.name] : undefined;
  if (!next || !nextTime) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = calculatePrayerTimes(coordinates, tomorrow);
    next = PRAYERS[0];
    nextTime = tomorrowTimes.subuh;
  }

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const NextIcon = next.icon;

  if (variant === "home") {
    return (
      <section className="prototype-prayer prototype-prayer--home" aria-label="Jadwal shalat hari ini">
        <header className="prototype-prayer__header">
          <span className="prototype-prayer__mosque" aria-hidden="true">
            <Landmark size={23} />
          </span>
          <div>
            <h2>Jadwal Shalat Hari Ini</h2>
            <p>{dateLabel}</p>
          </div>
          <span className="prototype-prayer__location">
            <MapPin size={15} aria-hidden="true" />
            {locationLabel}
          </span>
        </header>
        <ol className="prototype-prayer__times">
          {PRAYERS.map(({ name, label, icon: Icon }) => {
            const active = name === next.name;
            return (
              <li key={name} className={active ? "is-next" : undefined}>
                {active && <span className="prototype-prayer__next-label">Selanjutnya</span>}
                <Icon size={25} aria-hidden="true" />
                <span>{label}</span>
                <time dateTime={times[name].toISOString()}>{formatTime24(times[name])}</time>
                {active && (
                  <small>
                    <Clock3 size={12} aria-hidden="true" /> {countdown(nextTime, now)}
                  </small>
                )}
              </li>
            );
          })}
        </ol>
        <p className="prototype-prayer__verse">
          “Dirikanlah shalat, sesungguhnya shalat itu mencegah dari perbuatan keji dan mungkar.”
          <span>(QS. Al-Ankabut: 45)</span>
        </p>
      </section>
    );
  }

  return (
    <section className="prototype-prayer prototype-prayer--detail" aria-label="Shalat berikutnya">
      <div className="prototype-prayer__next-icon" aria-hidden="true">
        <NextIcon size={55} />
      </div>
      <div className="prototype-prayer__next-copy">
        <span className="prototype-prayer__next-label">Selanjutnya</span>
        <h2>{next.label}</h2>
        <time dateTime={nextTime.toISOString()}>{formatTime24(nextTime)}</time>
        <p>
          <Clock3 size={16} aria-hidden="true" /> {countdown(nextTime, now)} menuju waktu
        </p>
      </div>
      <blockquote>
        <span aria-hidden="true">“</span>
        <p>Dirikanlah shalat, sesungguhnya shalat itu mencegah dari perbuatan keji dan mungkar.</p>
        <cite>(QS. Al-Ankabut: 45)</cite>
      </blockquote>
    </section>
  );
}
