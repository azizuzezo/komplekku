"use client";

import {
  ANNOUNCEMENT_FILTER_LABELS,
  announcementFilterSchema,
  type AnnouncementFilter,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AnnouncementListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { TestPushNotificationButton } from "@/features/notification/test-push-notification-button";
import { getRequestState } from "@/lib/api/client";

import { announcementKeys, archiveAnnouncement, getAnnouncements } from "./announcement-api";
import { AnnouncementRow } from "./announcement-row";
import { CreateAnnouncementModal, EditAnnouncementModal } from "./create-announcement-modal";

const FILTERS = announcementFilterSchema.options;

export function AnnouncementList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AnnouncementFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const announcementsQuery = useQuery({
    queryKey: announcementKeys.list(filter),
    queryFn: () => getAnnouncements(filter),
  });

  const canManage = meQuery.data?.data.permissions.includes("announcement.manage") ?? false;

  const archiveMutation = useMutation({
    mutationFn: archiveAnnouncement,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: announcementKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });

  const filterChips = (
    <div className="announcement-filters" role="group" aria-label="Saring pengumuman">
      {FILTERS.map((value) => (
        <button
          key={value}
          type="button"
          className="announcement-filters__chip"
          aria-pressed={filter === value}
          onClick={() => setFilter(value)}
        >
          {ANNOUNCEMENT_FILTER_LABELS[value]}
        </button>
      ))}
    </div>
  );

  if (announcementsQuery.isPending) {
    return (
      <div className="announcement-page-wrapper">
        {filterChips}
        <AnnouncementListSkeleton rows={5} />
      </div>
    );
  }

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
    <div className="announcement-page-wrapper prototype-announcements">
      {editingId && (
        <EditAnnouncementModal announcementId={editingId} onClose={() => setEditingId(null)} />
      )}
      {canManage && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <TestPushNotificationButton />
          <CreateAnnouncementModal />
        </div>
      )}

      {filterChips}

      {announcements.length === 0 ? (
        <StatePanel
          kind="empty"
          title={filter === "all" ? "Belum ada pengumuman" : "Tidak ada yang cocok"}
          description={
            filter === "all"
              ? "Pengumuman yang diterbitkan pengurus akan muncul di sini."
              : "Coba pilih kategori lain untuk melihat pengumuman lainnya."
          }
        />
      ) : (
        <div className="announcement-list">
          {announcements.map((announcement) => (
            <AnnouncementRow
              announcement={announcement}
              key={announcement.id}
              canManage={canManage}
              onEdit={() => setEditingId(announcement.id)}
              onDelete={() => archiveMutation.mutateAsync(announcement.id)}
              isBusy={archiveMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
