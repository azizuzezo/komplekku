"use client";

import type { AnnouncementDetailResponse } from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { AnnouncementDetailSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { ApiError, getRequestState } from "@/lib/api/client";

import { getAnnouncement, markAnnouncementRead } from "./announcement-api";
import { formatAnnouncementDate, getPriorityLabel } from "./format-announcement";

export function AnnouncementDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const attemptedReadId = useRef<string | null>(null);
  const announcementQuery = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => getAnnouncement(id),
  });
  const readMutation = useMutation({
    mutationFn: () => markAnnouncementRead(id),
    onSuccess() {
      queryClient.setQueryData<AnnouncementDetailResponse>(["announcement", id], (current) =>
        current
          ? {
              ...current,
              data: {
                ...current.data,
                announcement: { ...current.data.announcement, isRead: true },
              },
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });

  const queriedAnnouncement = announcementQuery.data?.data.announcement;
  useEffect(() => {
    if (!queriedAnnouncement || queriedAnnouncement.isRead || attemptedReadId.current === id)
      return;
    attemptedReadId.current = id;
    readMutation.mutate();
  }, [id, queriedAnnouncement, readMutation]);

  if (announcementQuery.isPending) return <AnnouncementDetailSkeleton />;

  if (announcementQuery.isError) {
    const state = getRequestState(announcementQuery.error);
    if (announcementQuery.error instanceof ApiError && announcementQuery.error.status === 404) {
      return (
        <StatePanel
          kind="empty"
          title="Pengumuman tidak ditemukan"
          description="Pengumuman mungkin sudah diarsipkan atau alamatnya tidak tepat."
          headingLevel={1}
          actionHref="/pengumuman"
          actionLabel="Kembali ke daftar"
        />
      );
    }
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk membaca pengumuman ini."
          headingLevel={1}
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Pengumuman tidak dapat diakses"
          description="Pengumuman ini tidak ditujukan untuk akunmu."
          headingLevel={1}
          actionHref="/pengumuman"
          actionLabel="Kembali ke daftar"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Pengumuman ini belum tersedia secara offline."
          headingLevel={1}
          onRetry={() => void announcementQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Pengumuman belum bisa dimuat"
        description="Terjadi kendala saat mengambil isi pengumuman."
        headingLevel={1}
        onRetry={() => void announcementQuery.refetch()}
      />
    );
  }

  const announcement = announcementQuery.data.data.announcement;

  return (
    <article
      className={`announcement-detail announcement-detail--${announcement.priority.toLowerCase()}`}
    >
      <Link className="text-link" href="/pengumuman">
        <ArrowLeft size={16} aria-hidden="true" />
        Semua pengumuman
      </Link>
      <header>
        <div className="announcement-row__meta">
          {announcement.priority !== "NORMAL" && (
            <span
              className={`priority-label priority-label--${announcement.priority.toLowerCase()}`}
            >
              {getPriorityLabel(announcement.priority)}
            </span>
          )}
          <time dateTime={announcement.publishedAt}>
            {formatAnnouncementDate(announcement.publishedAt)}
          </time>
        </div>
        <h1>{announcement.title}</h1>
        <p className="announcement-detail__summary">{announcement.summary}</p>
      </header>
      <div className="announcement-detail__body">{announcement.body}</div>
      {readMutation.isError && (
        <div className="read-status-error" role="status">
          <p>Status baca belum tersimpan.</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              attemptedReadId.current = id;
              readMutation.mutate();
            }}
            disabled={readMutation.isPending}
          >
            Coba simpan lagi
          </button>
        </div>
      )}
    </article>
  );
}
