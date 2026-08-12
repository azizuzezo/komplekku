import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { IncidentList } from "@/features/incident/incident-list";

export const metadata: Metadata = {
  title: "Laporan kejadian",
  description: "Daftar laporan kejadian keamanan lingkungan.",
};

export default function IncidentListPage() {
  return (
    <AppShell contextLabel="Kejadian">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Laporan kejadian</h1>
          <p>Tinjau dan catat kejadian keamanan yang dilaporkan di lingkunganmu.</p>
        </header>
        <IncidentList />
      </div>
    </AppShell>
  );
}
