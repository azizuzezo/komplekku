import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { DuesAdminPanel } from "@/features/invoice/dues-admin-panel";

export const metadata: Metadata = {
  title: "Kelola iuran",
  description: "Kelola jenis iuran, terbitkan tagihan, dan tinjau tagihan komunitas.",
};

export default function KelolaIuranPage() {
  return (
    <AppShell contextLabel="Kelola iuran">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Kelola iuran</h1>
          <p>Atur jenis iuran, terbitkan tagihan massal, dan kelola pembebasan tagihan.</p>
        </header>
        <DuesAdminPanel />
      </div>
    </AppShell>
  );
}
