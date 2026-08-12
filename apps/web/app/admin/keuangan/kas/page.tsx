import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { CashLedgerPanel } from "@/features/cash/cash-ledger-panel";

export const metadata: Metadata = {
  title: "Kelola kas",
  description: "Catat transaksi kas dan pantau saldo lingkungan.",
};

export default function KelolaKasPage() {
  return (
    <AppShell contextLabel="Kelola kas">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Kelola kas</h1>
          <p>Catat transaksi kas baru dan pantau saldo lingkungan.</p>
        </header>
        <CashLedgerPanel />
      </div>
    </AppShell>
  );
}
