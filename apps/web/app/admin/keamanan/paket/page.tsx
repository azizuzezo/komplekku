import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { PackageManagePanel } from "@/features/package/package-manage-panel";

export const metadata: Metadata = {
  title: "Kelola paket",
  description: "Catat kedatangan paket dan tandai pengambilan di pos satpam.",
};

export default function KelolaPaketPage() {
  return (
    <AppShell contextLabel="Kelola paket">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Paket & pengiriman</h1>
          <p>Catat paket yang baru tiba dan tandai pengambilan langsung dari pos satpam.</p>
        </header>
        <PackageManagePanel />
      </div>
    </AppShell>
  );
}
