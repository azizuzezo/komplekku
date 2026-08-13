"use client";

import { useQuery } from "@tanstack/react-query";

import { AnnouncementListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { getAnnouncements } from "./announcement-api";
import { AnnouncementRow } from "./announcement-row";
import { CreateAnnouncementModal } from "./create-announcement-modal";

export function AnnouncementList() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const announcementsQuery = useQuery({ queryKey: ["announcements"], queryFn: getAnnouncements });

  const canManage = meQuery.data?.data.permissions.includes("announcement.manage") ?? false;

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

  return (
    <div className="announcement-page-wrapper">
      {canManage && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <CreateAnnouncementModal />
        </div>
      )}

      {announcements.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada pengumuman"
          description="Pengumuman yang diterbitkan pengurus akan muncul di sini."
        />
      ) : (
        <div className="announcement-list">
          {announcements.map((announcement) => (
            <AnnouncementRow announcement={announcement} key={announcement.id} />
          ))}
        </div>
      )}
    </div>
  );
}
