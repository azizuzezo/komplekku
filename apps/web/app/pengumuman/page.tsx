import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { AnnouncementList } from "@/features/announcement/announcement-list";

export const metadata: Metadata = {
  title: "Pengumuman",
};

export default function AnnouncementsPage() {
  return (
    <AppShell contextLabel="Pengumuman">
      <div className="page-content page-content--narrow">
        <header className="page-heading page-heading--index">
          <h1>Pengumuman lingkungan</h1>
          <p>Catatan resmi dari pengurus, tersusun dari yang terbaru.</p>
        </header>
        <AnnouncementList />
      </div>
    </AppShell>
  );
}
