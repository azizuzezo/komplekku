import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { PatrolPanel } from "@/features/patrol/patrol-panel";

export const metadata: Metadata = {
  title: "Patroli",
  description: "Jalankan dan pantau patroli titik periksa lingkungan.",
};

export default function PatrolPage() {
  return (
    <AppShell contextLabel="Patroli">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Patroli lingkungan</h1>
          <p>Mulai sesi patroli, pindai titik periksa, dan lihat riwayatnya.</p>
        </header>
        <PatrolPanel />
      </div>
    </AppShell>
  );
}
