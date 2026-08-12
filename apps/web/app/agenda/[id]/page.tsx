import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AgendaDetail } from "@/features/agenda/agenda-detail";

export const metadata: Metadata = {
  title: "Detail agenda",
};

export default async function AgendaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell contextLabel="Agenda">
      <div className="page-content page-content--narrow">
        <AgendaDetail id={id} />
      </div>
    </AppShell>
  );
}
