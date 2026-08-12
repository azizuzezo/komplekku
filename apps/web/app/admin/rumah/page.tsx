import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { HouseAdminPanel } from "@/features/house/house-admin-panel";

export const metadata: Metadata = {
  title: "Kelola rumah",
  description: "Tambahkan rumah baru untuk komunitas, termasuk nama blok berformat bebas.",
};

export default function HouseAdminPage() {
  return (
    <AppShell contextLabel="Kelola rumah">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Kelola rumah</h1>
          <p>Tambahkan rumah baru dan lihat status huniannya.</p>
        </header>
        <HouseAdminPanel />
      </div>
    </AppShell>
  );
}
