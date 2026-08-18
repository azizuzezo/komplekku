import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AgendaCalendar } from "@/features/agenda/agenda-calendar";

export const metadata: Metadata = {
  title: "Kalender agenda",
  description: "Kalender bulanan kegiatan lingkungan yang diterbitkan pengurus.",
};

export default function AgendaCalendarPage() {
  return (
    <AppShell contextLabel="Agenda">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Kalender agenda</h1>
          <p>Lihat kegiatan warga per bulan, lalu pilih tanggal untuk detailnya.</p>
        </header>
        <AgendaCalendar />
      </div>
    </AppShell>
  );
}
