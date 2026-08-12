import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ReportTriageList } from "@/features/report/report-triage-list";

export const metadata: Metadata = {
  title: "Kelola laporan",
  description: "Tinjau dan tindak lanjuti laporan masalah yang dikirim warga.",
};

export default function AdminLaporanPage() {
  return (
    <AppShell contextLabel="Kelola laporan">
      <div className="page-content">
        <header className="page-heading page-heading--index">
          <h1>Kelola laporan warga</h1>
          <p>Tinjau laporan masalah lingkungan dari seluruh warga dan perbarui statusnya.</p>
        </header>
        <ReportTriageList />
      </div>
    </AppShell>
  );
}
