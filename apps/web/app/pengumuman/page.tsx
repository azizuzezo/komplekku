import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AnnouncementList } from "@/features/announcement/announcement-list";

export const metadata: Metadata = {
  title: "Pengumuman",
};

export default function AnnouncementsPage() {
  return (
    <AppShell contextLabel="Pengumuman">
      <div className="page-content page-content--narrow prototype-announcement-page">
        <header className="page-heading page-heading--index">
          <h1>Pengumuman</h1>
          <p>RT 05 / RW 03 · Billabong</p>
        </header>
        <AnnouncementList />
      </div>
    </AppShell>
  );
}
