import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ReportTriageDetail } from "@/features/report/report-triage-detail";

export const metadata: Metadata = {
  title: "Detail laporan",
};

export default async function AdminLaporanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell contextLabel="Detail laporan">
      <div className="page-content page-content--narrow">
        <ReportTriageDetail id={id} />
      </div>
    </AppShell>
  );
}
