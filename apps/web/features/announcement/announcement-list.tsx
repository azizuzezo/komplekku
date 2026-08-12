"use client";

import { useQuery } from "@tanstack/react-query";

import { AnnouncementListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getRequestState } from "@/lib/api/client";

import { getAnnouncements } from "./announcement-api";
import { AnnouncementRow } from "./announcement-row";

export function AnnouncementList() {
  const announcementsQuery = useQuery({ queryKey: ["announcements"], queryFn: getAnnouncements });

  if (announcementsQuery.isPending) return <AnnouncementListSkeleton rows={5} />;

  if (announcementsQuery.isError) {
    const state = getRequestState(announcementsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk membaca pengumuman lingkunganmu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Pengumuman belum dapat diakses"
          description="Akunmu belum memiliki izin untuk melihat informasi lingkungan."
          actionHref="/akun"
          actionLabel="Lihat akun"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar pengumuman belum dapat diperbarui."
          onRetry={() => void announcementsQuery.refetch()}
          actionHref="/offline"
          actionLabel="Info mode offline"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Pengumuman belum bisa dimuat"
        description="Terjadi kendala saat mengambil pengumuman."
        onRetry={() => void announcementsQuery.refetch()}
      />
    );
  }

  const announcements = announcementsQuery.data.data.items;
  if (announcements.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada pengumuman"
        description="Pengumuman yang diterbitkan pengurus akan muncul di sini."
      />
    );
  }

  return (
    <div className="announcement-list">
      {announcements.map((announcement) => (
        <AnnouncementRow announcement={announcement} key={announcement.id} />
      ))}
    </div>
  );
}
