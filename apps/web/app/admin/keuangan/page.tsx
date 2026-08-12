import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { FinanceDashboardPanel } from "@/features/finance-dashboard/finance-dashboard-panel";

export const metadata: Metadata = {
  title: "Dasbor keuangan",
  description: "Ringkasan tagihan, verifikasi pembayaran, dan saldo kas untuk pengurus keuangan.",
};

export default function KeuanganPage() {
  return (
    <AppShell contextLabel="Keuangan">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Dasbor keuangan</h1>
          <p>Pantau tagihan warga, verifikasi pembayaran, dan saldo kas lingkungan.</p>
        </header>
        <FinanceDashboardPanel />
      </div>
    </AppShell>
  );
}
