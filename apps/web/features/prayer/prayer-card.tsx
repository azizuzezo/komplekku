"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Clock, Volume2, VolumeX, Radio, CheckCircle2, Navigation, Play } from "lucide-react";
import {
  calculatePrayerTimes,
  DEFAULT_COMMUNITY_COORDINATES,
  formatDurationMMSS,
  formatTime24,
  getAdzanState,
  type PrayerName,
} from "@komplekku/contracts";

const PRAYER_LABELS: Record<PrayerName, string> = {
  subuh: "Subuh",
  syuruq: "Terbit",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};

export function PrayerCard() {
  const [coords, setCoords] = useState(DEFAULT_COMMUNITY_COORDINATES);
  const [usingGps, setUsingGps] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [isMuted, setIsMuted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request browser GPS location if available
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setUsingGps(true);
        },
        () => {
          setUsingGps(false);
        },
        { timeout: 5000 },
      );
    }
  }, []);

  // Request notification permission status
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  // Realtime clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerTimes = calculatePrayerTimes(coords, now);
  const adzanState = getAdzanState(now, prayerTimes);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const res = await Notification.requestPermission();
      setNotifGranted(res === "granted");
    }
  };

  /** Internal: plays a given audio file and wires up state */
  const startAudio = (src: string) => {
    // Stop any existing audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    setIsPlayingAudio(true);
    audio.play().catch((err) => {
      console.warn("Audio playback error:", err);
      setIsPlayingAudio(false);
    });
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
  };

  /** Stop whatever is currently playing */
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  // Play real Adzan audio (assets/adzan.mp3 → public/audio/adzan.mp3)
  const playAdzanAudio = () => startAudio("/audio/adzan.mp3");

  // Play Iqomah audio (replace iqomah.wav with real file when available)
  const playIqomahAudio = () => startAudio("/audio/iqomah.wav");

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastTriggeredAdzanRef = useRef<string | null>(null);

  useEffect(() => {
    if (adzanState.kind === "ADZAN" && adzanState.activePrayer) {
      const key = `${adzanState.activePrayer}-${adzanState.adzanTimeMs}`;
      if (lastTriggeredAdzanRef.current !== key) {
        lastTriggeredAdzanRef.current = key;
        if (!isMuted) {
          playAdzanAudio();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adzanState, isMuted]);

  // Determine next upcoming prayer (chronological search)
  const upcomingPrayers: Array<{ name: PrayerName; time: Date }> = [
    { name: "subuh", time: prayerTimes.subuh },
    { name: "syuruq", time: prayerTimes.syuruq },
    { name: "dzuhur", time: prayerTimes.dzuhur },
    { name: "ashar", time: prayerTimes.ashar },
    { name: "maghrib", time: prayerTimes.maghrib },
    { name: "isya", time: prayerTimes.isya },
  ];

  let nextPrayerItem = upcomingPrayers.find((p) => p.time.getTime() > now.getTime());
  if (!nextPrayerItem) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = calculatePrayerTimes(coords, tomorrow);
    nextPrayerItem = { name: "subuh", time: tomorrowTimes.subuh };
  }

  const diffSeconds = Math.max(
    0,
    Math.floor((nextPrayerItem.time.getTime() - now.getTime()) / 1000),
  );
  const hoursRemaining = Math.floor(diffSeconds / 3600);
  const minsRemaining = Math.floor((diffSeconds % 3600) / 60);
  const secsRemaining = diffSeconds % 60;

  const countdownText =
    hoursRemaining > 0
      ? `${hoursRemaining}j ${minsRemaining.toString().padStart(2, "0")}m ${secsRemaining.toString().padStart(2, "0")}d`
      : `${minsRemaining}m ${secsRemaining.toString().padStart(2, "0")}d`;

  // Format realtime clock strings
  const timeString = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const dateString = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className="prayer-card card p-0 mb-5 overflow-hidden border-border shadow-xs bg-surface rounded-2xl">
      {/* Responsive Hero Banner in Dark Cyan Slate (#0F2F34) */}
      <div className="p-4 sm:p-5 bg-[#0F2F34] text-white space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
                {timeString}
              </span>
              <span className="text-xs font-extrabold tracking-wider text-[#4DD0E1] uppercase">
                WIB
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00ACC1]/25 text-[#80DEEA] font-semibold border border-[#00ACC1]/40 inline-flex items-center gap-1">
                <Navigation size={11} className="text-[#4DD0E1]" />
                {usingGps ? "GPS Presisi" : "Billabong Blok F"}
              </span>
            </div>
            <p className="text-xs text-[#B2EBF2] font-medium">{dateString}</p>
          </div>

          {/* ── Audio Controls ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Adzan button — always visible */}
            <button
              type="button"
              id="btn-adzan"
              onClick={playAdzanAudio}
              disabled={isPlayingAudio}
              title="Putar Suara Adzan"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "0.625rem",
                border: "none",
                background: isPlayingAudio ? "rgba(255,255,255,0.15)" : "#00ACC1",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: isPlayingAudio ? "not-allowed" : "pointer",
                opacity: isPlayingAudio ? 0.6 : 1,
                transition: "background 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Play size={13} style={{ fill: "currentColor" }} />
              Adzan
            </button>

            {/* Iqomah button — always visible */}
            <button
              type="button"
              id="btn-iqomah"
              onClick={playIqomahAudio}
              disabled={isPlayingAudio}
              title="Putar Suara Iqomah"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "0.625rem",
                border: "none",
                background: isPlayingAudio ? "rgba(255,255,255,0.15)" : "#4DD0E1",
                color: isPlayingAudio ? "#fff" : "#0F2F34",
                fontSize: "0.75rem",
                fontWeight: 800,
                cursor: isPlayingAudio ? "not-allowed" : "pointer",
                opacity: isPlayingAudio ? 0.6 : 1,
                transition: "background 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Volume2 size={14} />
              Iqomah
            </button>

            {/* Stop button — only visible while audio is playing */}
            {isPlayingAudio && (
              <button
                type="button"
                id="btn-stop-audio"
                onClick={stopAudio}
                title="Hentikan Audio"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.625rem",
                  border: "1.5px solid rgba(255,100,100,0.6)",
                  background: "rgba(220,38,38,0.18)",
                  color: "#fca5a5",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  animation: "pulse 1.4s infinite",
                }}
              >
                <VolumeX size={13} />
                Stop
              </button>
            )}

            {/* Mute toggle */}
            <button
              type="button"
              id="btn-mute-toggle"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Auto-adzan mati" : "Auto-adzan aktif"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2rem",
                height: "2rem",
                borderRadius: "0.625rem",
                border: "none",
                background: isMuted ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)",
                color: isMuted ? "rgba(255,255,255,0.4)" : "#fff",
                cursor: "pointer",
              }}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Notification permission */}
            {!notifGranted && (
              <button
                type="button"
                id="btn-notif-permission"
                onClick={requestNotificationPermission}
                title="Aktifkan Notifikasi Waktu Sholat"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.375rem 0.625rem",
                  borderRadius: "0.625rem",
                  border: "none",
                  background: "#80DEEA",
                  color: "#0F2F34",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Bell size={14} />
                Notif
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Next Prayer Countdown Bar */}
        <div className="flex items-center justify-between bg-surface-soft p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping shrink-0" />
            <span className="text-xs sm:text-sm text-text-primary font-semibold">
              Menuju sholat{" "}
              <strong className="text-primary font-extrabold">
                {PRAYER_LABELS[nextPrayerItem.name]}
              </strong>{" "}
              ({formatTime24(nextPrayerItem.time)})
            </span>
          </div>
          <div className="font-mono text-xs sm:text-sm font-bold text-primary bg-surface px-3 py-1 rounded-lg border border-border shadow-2xs">
            -{countdownText}
          </div>
        </div>

        {/* Adzan & 5m Gap & 6m Iqomah Active Timer Banner */}
        {adzanState.kind !== "IDLE" && adzanState.activePrayer && (
          <div className="p-3.5 rounded-xl border border-primary bg-surface-soft shadow-2xs animate-fade-in">
            {adzanState.kind === "ADZAN" && (
              <div className="flex items-center justify-between text-primary font-bold text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  <Radio size={16} className="animate-spin" />
                  Waktu Adzan {PRAYER_LABELS[adzanState.activePrayer]} Telah Tiba
                </span>
                <button
                  type="button"
                  onClick={playAdzanAudio}
                  className="text-xs font-extrabold underline text-primary cursor-pointer hover:opacity-80"
                >
                  Putar Adzan
                </button>
              </div>
            )}

            {adzanState.kind === "POST_ADZAN_GAP" && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-text-primary text-xs sm:text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-success" />
                    Adzan {PRAYER_LABELS[adzanState.activePrayer]} Berkumandang
                  </span>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Jeda persiapan sebelum hitung mundur Iqomah (5m)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-primary">
                    {formatDurationMMSS(adzanState.gapSecondsRemaining)}
                  </span>
                </div>
              </div>
            )}

            {adzanState.kind === "IQOMAH_COUNTDOWN" && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-text-primary text-xs sm:text-sm flex items-center gap-1.5">
                    <Clock size={15} className="text-danger animate-bounce" />
                    Hitung Mundur Iqomah {PRAYER_LABELS[adzanState.activePrayer]}
                  </span>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Menuju pelaksanaan sholat berjamaah
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={playIqomahAudio}
                    className="text-xs font-bold text-danger hover:underline"
                  >
                    Suara Iqomah
                  </button>
                  <span className="font-mono text-xl font-black text-danger tracking-wider">
                    {formatDurationMMSS(adzanState.iqomahSecondsRemaining)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prayer Schedule Grid (3x2 or 6x1 responsive) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center">
          {(["subuh", "syuruq", "dzuhur", "ashar", "maghrib", "isya"] as PrayerName[]).map(
            (name) => {
              const isNext = name === nextPrayerItem?.name;
              const isActiveAdzan = adzanState.activePrayer === name;
              return (
                <div
                  key={name}
                  className={`p-3 rounded-xl border transition-all ${
                    isActiveAdzan
                      ? "border-primary bg-primary text-white font-bold shadow-md scale-[1.02]"
                      : isNext
                        ? "border-primary bg-surface-soft font-bold text-text-primary shadow-2xs"
                        : "border-border bg-surface text-text-primary hover:border-primary/50"
                  }`}
                >
                  <div className="text-[11px] text-text-secondary font-semibold">
                    {PRAYER_LABELS[name]}
                  </div>
                  <div className="text-sm font-mono mt-1 font-extrabold text-text-primary">
                    {formatTime24(prayerTimes[name])}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
