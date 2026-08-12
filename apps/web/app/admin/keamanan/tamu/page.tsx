import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { VisitorCheckinPanel } from "@/features/visitor/visitor-checkin-panel";

export const metadata: Metadata = {
  title: "Check-in tamu",
  description: "Cari kode QR tamu, catat tamu walk-in, dan kelola check-in serta check-out.",
};

export default function VisitorCheckinPage() {
  return (
    <AppShell contextLabel="Check-in tamu">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Check-in & check-out tamu</h1>
          <p>Pos keamanan untuk memproses kedatangan tamu, baik yang diundang maupun walk-in.</p>
        </header>
        <VisitorCheckinPanel />
      </div>
    </AppShell>
  );
}
