"use client";

import type { AgendaView } from "@komplekku/contracts";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AgendaListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { agendaKeys, archiveAgendaEvent, getAgendaPage } from "./agenda-api";
import { AgendaRow } from "./agenda-row";
import { CreateAgendaModal, EditAgendaModal } from "./create-agenda-modal";

export function AgendaList({ view }: { view: AgendaView }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const agendaQuery = useInfiniteQuery({
    queryKey: agendaKeys.list(view),
    queryFn: ({ pageParam }) => getAgendaPage({ view, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
  });

  const canManage = meQuery.data?.data.permissions.includes("agenda.manage") ?? false;

  const archiveMutation = useMutation({
    mutationFn: archiveAgendaEvent,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
    },
  });

  if (agendaQuery.isPending) return <AgendaListSkeleton />;

  if (agendaQuery.isError) {
    const state = getRequestState(agendaQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat agenda lingkunganmu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Agenda belum dapat diakses"
          description="Akunmu belum memiliki izin untuk melihat agenda lingkungan."
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
          description="Daftar agenda belum dapat diperbarui."
          onRetry={() => void agendaQuery.refetch()}
          actionHref="/offline"
          actionLabel="Info mode offline"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Agenda belum bisa dimuat"
        description="Terjadi kendala saat mengambil agenda lingkungan."
        onRetry={() => void agendaQuery.refetch()}
      />
    );
  }

  const events = agendaQuery.data.pages.flatMap((page) => page.data.items);
  const fetchNextPage = agendaQuery.fetchNextPage;

  return (
    <div className="agenda-index">
      {editingId && <EditAgendaModal eventId={editingId} onClose={() => setEditingId(null)} />}
      {canManage && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <CreateAgendaModal />
        </div>
      )}

      <nav className="agenda-view-switcher" aria-label="Tampilan agenda">
        <Link href="/agenda?view=upcoming" aria-current={view === "upcoming" ? "page" : undefined}>
          Mendatang
        </Link>
        <Link href="/agenda?view=past" aria-current={view === "past" ? "page" : undefined}>
          Lampau
        </Link>
        <Link href="/agenda/kalender">Kalender</Link>
      </nav>

      {events.length === 0 ? (
        <StatePanel
          kind="empty"
          title={view === "upcoming" ? "Belum ada agenda mendatang" : "Belum ada agenda lampau"}
          description={
            view === "upcoming"
              ? "Kegiatan yang diterbitkan pengurus akan muncul di sini."
              : "Riwayat kegiatan lingkungan akan muncul di sini."
          }
        />
      ) : (
        <div className="agenda-list">
          {events.map((event) => (
            <AgendaRow
              event={event}
              key={event.id}
              canManage={canManage}
              onEdit={() => setEditingId(event.id)}
              onDelete={() => archiveMutation.mutateAsync(event.id)}
              isBusy={archiveMutation.isPending}
            />
          ))}
        </div>
      )}

      {agendaQuery.isFetchNextPageError && (
        <div className="pagination-error" role="status">
          <p>Agenda berikutnya belum dapat dimuat.</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => void fetchNextPage()}
          >
            Coba lagi
          </button>
        </div>
      )}

      {agendaQuery.hasNextPage && !agendaQuery.isFetchNextPageError && (
        <button
          className="button button--secondary pagination-action"
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={agendaQuery.isFetchingNextPage}
        >
          {agendaQuery.isFetchingNextPage ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Memuat agenda…
            </>
          ) : (
            "Muat agenda berikutnya"
          )}
        </button>
      )}
    </div>
  );
}
