import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { IncidentDetail } from "@/features/incident/incident-detail";

export const metadata: Metadata = {
  title: "Detail kejadian",
};

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell contextLabel="Detail kejadian">
      <div className="page-content page-content--narrow">
        <IncidentDetail id={id} />
      </div>
    </AppShell>
  );
}
