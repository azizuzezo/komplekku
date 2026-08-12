import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { PackageList } from "@/features/package/package-list";

export const metadata: Metadata = {
  title: "Paket",
  description: "Paket masuk untuk rumahmu, tercatat oleh satpam lingkungan.",
};

export default function PaketPage() {
  return (
    <AppShell contextLabel="Paket">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Paket masuk</h1>
          <p>Pantau kiriman yang diterima satpam untuk rumahmu, dari catat hingga diambil.</p>
        </header>
        <PackageList />
      </div>
    </AppShell>
  );
}
