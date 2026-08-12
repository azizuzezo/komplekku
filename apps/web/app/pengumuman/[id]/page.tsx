import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AnnouncementDetail } from "@/features/announcement/announcement-detail";

export const metadata: Metadata = {
  title: "Detail pengumuman",
};

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell contextLabel="Pengumuman">
      <div className="page-content page-content--narrow">
        <AnnouncementDetail id={id} />
      </div>
    </AppShell>
  );
}
