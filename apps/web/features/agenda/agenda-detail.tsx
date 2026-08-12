"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import Link from "next/link";

import { AgendaDetailSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { ApiError, getRequestState } from "@/lib/api/client";

import { agendaKeys, getAgendaEvent } from "./agenda-api";
import { formatAgendaDate, formatAgendaTimeRange } from "./format-agenda";

export function AgendaDetail({ id }: { id: string }) {
  const agendaQuery = useQuery({
    queryKey: agendaKeys.detail(id),
    queryFn: () => getAgendaEvent(id),
  });

  if (agendaQuery.isPending) return <AgendaDetailSkeleton />;

  if (agendaQuery.isError) {
    const state = getRequestState(agendaQuery.error);
    if (agendaQuery.error instanceof ApiError && agendaQuery.error.status === 404) {
      return (
        <StatePanel
          kind="empty"
          title="Agenda tidak ditemukan"
          description="Agenda mungkin sudah diarsipkan atau alamatnya tidak tepat."
          headingLevel={1}
          actionHref="/agenda"
          actionLabel="Kembali ke agenda"
        />
      );
    }
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat agenda ini."
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
          title="Agenda tidak dapat diakses"
          description="Akunmu belum memiliki izin untuk melihat agenda ini."
          headingLevel={1}
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
          description="Agenda ini belum tersedia secara offline."
          headingLevel={1}
          onRetry={() => void agendaQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Agenda belum bisa dimuat"
        description="Terjadi kendala saat mengambil detail agenda."
        headingLevel={1}
        onRetry={() => void agendaQuery.refetch()}
      />
    );
  }

  const event = agendaQuery.data.data.event;

  return (
    <article className="agenda-detail">
      <Link className="text-link" href="/agenda">
        <ArrowLeft size={16} aria-hidden="true" />
        Semua agenda
      </Link>
      <header>
        <p className="section-kicker">Agenda lingkungan</p>
        <h1>{event.title}</h1>
        <dl className="agenda-detail__facts">
          <div>
            <dt>
              <CalendarDays size={17} aria-hidden="true" />
              Tanggal
            </dt>
            <dd>
              <time dateTime={event.date}>{formatAgendaDate(event.date)}</time>
            </dd>
          </div>
          <div>
            <dt>
              <Clock3 size={17} aria-hidden="true" />
              Waktu
            </dt>
            <dd>{formatAgendaTimeRange(event.startTime, event.endTime)}</dd>
          </div>
          <div>
            <dt>
              <MapPin size={17} aria-hidden="true" />
              Lokasi
            </dt>
            <dd>{event.location}</dd>
          </div>
          <div>
            <dt>
              <UsersRound size={17} aria-hidden="true" />
              Penyelenggara
            </dt>
            <dd>{event.organizer}</dd>
          </div>
        </dl>
      </header>
      <div className="agenda-detail__body">{event.description}</div>
    </article>
  );
}
