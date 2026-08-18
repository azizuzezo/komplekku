import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { PrayerCard } from "@/features/prayer/prayer-card";
import { PrayerSchedule } from "@/features/prayer/prayer-schedule";

export const metadata: Metadata = {
  title: "Jadwal Shalat",
  description: "Jadwal shalat harian dan bulanan untuk lingkungan Komplekku.",
};

export default function ShalatPage() {
  return (
    <AppShell contextLabel="Shalat">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Jadwal Shalat</h1>
          <p>Waktu shalat hari ini dan sebulan penuh, lengkap dengan hitung mundur adzan.</p>
        </header>
        {/* PrayerCard already owns the live countdown, adzan state, and audio
            controls — this page adds the day/month schedule around it rather
            than duplicating that logic. */}
        <PrayerCard />
        <PrayerSchedule />
      </div>
    </AppShell>
  );
}
