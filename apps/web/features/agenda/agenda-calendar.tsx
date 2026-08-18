"use client";

import type { AgendaEvent } from "@komplekku/contracts";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AgendaListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { agendaKeys, getAgendaPage } from "./agenda-api";
import { AgendaRow } from "./agenda-row";
import { CreateAgendaModal } from "./create-agenda-modal";
import { formatAgendaDate } from "./format-agenda";

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const MONTH_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** `YYYY-MM-DD` for a UTC date, matching the API's date-only agenda contract
 * (agenda dates are wall-clock dates, not instants, so everything here stays
 * in UTC to avoid a timezone shifting an event onto the wrong day). */
function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, delta: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

/** Monday-first index (0 = Monday … 6 = Sunday), matching Indonesian calendars. */
function mondayFirstWeekday(date: Date) {
  return (date.getUTCDay() + 6) % 7;
}

/** The 6×7 grid of days covering `month`, padded with the trailing days of the
 * previous month and the leading days of the next so every week is complete. */
function buildMonthGrid(month: Date) {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setUTCDate(first.getUTCDate() - mondayFirstWeekday(first));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return date;
  });
}

function groupByDate(events: AgendaEvent[]) {
  const grouped = new Map<string, AgendaEvent[]>();
  for (const event of events) {
    const bucket = grouped.get(event.date);
    if (bucket) bucket.push(event);
    else grouped.set(event.date, [event]);
  }
  for (const bucket of grouped.values()) {
    bucket.sort((left, right) => left.startTime.localeCompare(right.startTime));
  }
  return grouped;
}

export function AgendaCalendar() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("agenda.manage") ?? false;

  // A calendar needs both directions at once — the month being browsed nearly
  // always straddles the "upcoming"/"past" split the list view is built on.
  const [upcomingQuery, pastQuery] = useQueries({
    queries: (["upcoming", "past"] as const).map((view) => ({
      queryKey: [...agendaKeys.list(view), "calendar"] as const,
      queryFn: () => getAgendaPage({ view, limit: 50 }),
    })),
  });

  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));

  const eventsByDate = useMemo(
    () =>
      groupByDate([
        ...(upcomingQuery.data?.data.items ?? []),
        ...(pastQuery.data?.data.items ?? []),
      ]),
    [upcomingQuery.data, pastQuery.data],
  );

  const grid = useMemo(() => buildMonthGrid(month), [month]);

  if (upcomingQuery.isPending || pastQuery.isPending) return <AgendaListSkeleton />;

  const loadError = upcomingQuery.error ?? pastQuery.error;
  if (loadError) {
    const state = getRequestState(loadError);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat kalender agenda lingkunganmu."
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
          description="Kalender agenda belum dapat diperbarui."
          onRetry={() => {
            void upcomingQuery.refetch();
            void pastQuery.refetch();
          }}
          actionHref="/offline"
          actionLabel="Info mode offline"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Kalender belum bisa dimuat"
        description="Terjadi kendala saat mengambil agenda lingkungan."
        onRetry={() => {
          void upcomingQuery.refetch();
          void pastQuery.refetch();
        }}
      />
    );
  }

  const monthIndex = month.getUTCMonth();
  const todayKey = toDateKey(today);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <div className="agenda-index">
      {canManage && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <CreateAgendaModal />
        </div>
      )}

      <nav className="agenda-view-switcher" aria-label="Tampilan agenda">
        <Link href="/agenda?view=upcoming">Mendatang</Link>
        <Link href="/agenda?view=past">Lampau</Link>
        <Link href="/agenda/kalender" aria-current="page">
          Kalender
        </Link>
      </nav>

      <section className="agenda-calendar" aria-label="Kalender agenda">
        <header className="agenda-calendar__header">
          <button
            className="button button--secondary agenda-calendar__nav"
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => setMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <h2 aria-live="polite">{MONTH_FORMATTER.format(month)}</h2>
          <button
            className="button button--secondary agenda-calendar__nav"
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => setMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </header>

        <div className="agenda-calendar__weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="agenda-calendar__grid" role="grid">
          {grid.map((date) => {
            const key = toDateKey(date);
            const dayEvents = eventsByDate.get(key) ?? [];
            const isOtherMonth = date.getUTCMonth() !== monthIndex;
            const classNames = [
              "agenda-calendar__day",
              isOtherMonth ? "agenda-calendar__day--muted" : "",
              key === todayKey ? "agenda-calendar__day--today" : "",
              key === selectedDate ? "agenda-calendar__day--selected" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                className={classNames}
                aria-pressed={key === selectedDate}
                aria-label={`${formatAgendaDate(key)}${
                  dayEvents.length > 0 ? `, ${dayEvents.length} agenda` : ", tidak ada agenda"
                }`}
                onClick={() => {
                  setSelectedDate(key);
                  if (isOtherMonth) setMonth(startOfMonth(date));
                }}
              >
                <span className="agenda-calendar__day-number">{date.getUTCDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="agenda-calendar__dots" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span className="agenda-calendar__dot" key={event.id} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Agenda pada tanggal terpilih" className="agenda-calendar__selection">
        <h2 className="section-kicker">{formatAgendaDate(selectedDate)}</h2>
        {selectedEvents.length === 0 ? (
          <StatePanel
            kind="empty"
            title="Tidak ada agenda pada tanggal ini"
            description="Pilih tanggal lain yang bertanda titik untuk melihat kegiatannya."
          />
        ) : (
          <div className="agenda-list">
            {selectedEvents.map((event) => (
              <AgendaRow event={event} key={event.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
