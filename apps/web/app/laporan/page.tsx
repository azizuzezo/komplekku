import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ReportList } from "@/features/report/report-list";

export const metadata: Metadata = {
  title: "Lapor Masalah",
  description: "Laporkan masalah lingkungan seperti lampu jalan, sampah, atau drainase.",
};

export default function LaporanPage() {
  return (
    <AppShell contextLabel="Lapor Masalah">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Lapor masalah lingkungan</h1>
          <p>
            Laporkan masalah seperti lampu jalan, sampah, drainase, atau fasilitas lain dan pantau
            progresnya di sini.
          </p>
        </header>
        <ReportList />
      </div>
    </AppShell>
  );
}
