import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { SecurityDashboardPanel } from "@/features/security-dashboard/security-dashboard-panel";

export const metadata: Metadata = {
  title: "Dasbor keamanan",
  description: "Ringkasan shift jaga, tamu, paket, kamera, dan darurat untuk petugas keamanan.",
};

export default function SecurityDashboardPage() {
  return (
    <AppShell contextLabel="Keamanan">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Dasbor keamanan</h1>
          <p>
            Pantau shift jaga dan kondisi lingkungan, lalu buka alat keamanan lainnya dari sini.
          </p>
        </header>
        <SecurityDashboardPanel />
      </div>
    </AppShell>
  );
}
