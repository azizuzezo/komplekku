import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ReportDetail } from "@/features/report/report-detail";

export const metadata: Metadata = {
  title: "Detail laporan",
};

export default async function LaporanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell contextLabel="Detail laporan">
      <div className="page-content page-content--narrow">
        <ReportDetail id={id} />
      </div>
    </AppShell>
  );
}
