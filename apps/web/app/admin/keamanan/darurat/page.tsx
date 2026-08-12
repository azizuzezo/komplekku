import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { EmergencyTriageList } from "@/features/emergency/emergency-triage-list";

export const metadata: Metadata = {
  title: "Triase darurat",
  description: "Pantau dan tanggapi sinyal darurat warga secara langsung.",
};

export default function TriaseDaruratPage() {
  return (
    <AppShell contextLabel="Triase darurat">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Sinyal darurat masuk</h1>
          <p>Pantau sinyal darurat warga secara langsung dan tanggapi sesuai urutan status.</p>
        </header>
        <EmergencyTriageList />
      </div>
    </AppShell>
  );
}
