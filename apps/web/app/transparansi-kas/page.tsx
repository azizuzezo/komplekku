import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { CashTransparencyView } from "@/features/cash/cash-transparency-view";

export const metadata: Metadata = {
  title: "Transparansi Kas",
  description: "Ringkasan dan riwayat transaksi kas lingkungan yang terbuka untuk warga.",
};

export default function TransparansiKasPage() {
  return (
    <AppShell contextLabel="Transparansi Kas">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Transparansi kas</h1>
          <p>Lihat saldo dan riwayat transaksi kas lingkungan secara terbuka.</p>
        </header>
        <CashTransparencyView />
      </div>
    </AppShell>
  );
}
