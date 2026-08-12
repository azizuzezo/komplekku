import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { EmergencySosPanel } from "@/features/emergency/emergency-sos-panel";

export const metadata: Metadata = {
  title: "Darurat",
  description: "Kirim sinyal darurat untuk memberi tahu petugas keamanan secara instan.",
};

export default function DaruratPage() {
  return (
    <AppShell contextLabel="Darurat">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Sinyal darurat</h1>
          <p>Kirim sinyal darurat untuk memberi tahu petugas keamanan lingkungan secara instan.</p>
        </header>
        <EmergencySosPanel />
      </div>
    </AppShell>
  );
}
