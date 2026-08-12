import type { AgendaView } from "@komplekku/contracts";
import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AgendaList } from "@/features/agenda/agenda-list";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Agenda kegiatan lingkungan yang diterbitkan pengurus.",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const requestedView = (await searchParams).view;
  const view: AgendaView = requestedView === "past" ? "past" : "upcoming";

  return (
    <AppShell contextLabel="Agenda">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Agenda lingkungan</h1>
          <p>Jadwal kegiatan warga dan lingkungan, tersusun berdasarkan tanggal.</p>
        </header>
        <AgendaList view={view} />
      </div>
    </AppShell>
  );
}
