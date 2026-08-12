import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ResidencyRequestQueue } from "@/features/admin/residency-request-queue";

export const metadata: Metadata = {
  title: "Permohonan warga",
  description: "Antrean permohonan tempat tinggal yang menunggu keputusan pengurus.",
};

export default function ResidencyRequestsPage() {
  return (
    <AppShell contextLabel="Permohonan warga">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Permohonan warga</h1>
          <p>Tinjau hubungan akun dengan rumah sebelum memberikan akses lingkungan.</p>
        </header>
        <ResidencyRequestQueue />
      </div>
    </AppShell>
  );
}
