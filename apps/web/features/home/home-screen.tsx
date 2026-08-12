"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import { HomeSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { AnnouncementRow } from "@/features/announcement/announcement-row";
import { agendaKeys, getAgendaPage } from "@/features/agenda/agenda-api";
import { formatAgendaDate, formatAgendaTimeRange } from "@/features/agenda/format-agenda";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { getHome } from "./home-api";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "pagi";
  if (hour < 15) return "siang";
  if (hour < 19) return "sore";
  return "malam";
}

function formatCommunityDate(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date());
  }
}

export function HomeScreen() {
  const homeQuery = useQuery({ queryKey: ["home"], queryFn: getHome });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canReadAgenda = meQuery.data?.data.permissions.includes("agenda.read") ?? false;
  const agendaPreviewQuery = useQuery({
    queryKey: agendaKeys.preview,
    queryFn: () => getAgendaPage({ view: "upcoming", limit: 1 }),
    enabled: canReadAgenda,
  });

  if (homeQuery.isPending) {
    return (
      <div className="page-content">
        <HomeSkeleton />
      </div>
    );
  }

  if (homeQuery.isError) {
    const state = getRequestState(homeQuery.error);
    if (state === "unauthorized") {
      return (
        <div className="page-content page-content--narrow">
          <StatePanel
            kind="unauthorized"
            title="Silakan masuk dulu"
            description="Masuk untuk melihat informasi rumah dan lingkunganmu."
            headingLevel={1}
            actionHref="/masuk"
            actionLabel="Masuk"
          />
        </div>
      );
    }
    if (state === "forbidden") {
      return (
        <div className="page-content page-content--narrow">
          <StatePanel
            kind="forbidden"
            title="Akses belum tersedia"
            description="Akunmu masih menunggu izin untuk melihat informasi lingkungan."
            headingLevel={1}
            actionHref="/akun"
            actionLabel="Lihat akun"
          />
        </div>
      );
    }
    if (state === "offline") {
      return (
        <div className="page-content page-content--narrow">
          <StatePanel
            kind="offline"
            title="Kamu sedang offline"
            description="Beranda belum dapat diperbarui. Sambungkan kembali perangkatmu lalu coba lagi."
            headingLevel={1}
            onRetry={() => void homeQuery.refetch()}
            actionHref="/offline"
            actionLabel="Info mode offline"
          />
        </div>
      );
    }
    return (
      <div className="page-content page-content--narrow">
        <StatePanel
          kind="error"
          title="Beranda belum bisa dimuat"
          description="Terjadi kendala saat mengambil informasi lingkunganmu."
          headingLevel={1}
          onRetry={() => void homeQuery.refetch()}
        />
      </div>
    );
  }

  const home = homeQuery.data.data;
  const latestAnnouncement = home.latestAnnouncements[0];
  const unreadCopy =
    home.unreadAnnouncementCount > 0
      ? `${home.unreadAnnouncementCount} belum dibaca`
      : "Semua sudah dibaca";
  const nextAgenda = agendaPreviewQuery.data?.data.items[0];

  return (
    <div className="page-content home-desk">
      <header className="resident-masthead">
        <div className="resident-masthead__context">
          <p>{home.community.name}</p>
          <time dateTime={new Date().toISOString()}>
            {formatCommunityDate(home.community.timezone)}
          </time>
        </div>
        <div className="resident-masthead__welcome">
          <h1>
            Selamat {getGreeting()}, {home.viewer.firstName}
          </h1>
          <p className="home-address">
            <MapPin size={17} aria-hidden="true" />
            {home.household.house.addressLabel}
          </p>
        </div>
      </header>

      <div className="home-desk__grid">
        <section className="home-noticeboard" aria-labelledby="latest-announcement-heading">
          <div className="section-heading section-heading--ruled">
            <div>
              <p className="section-kicker">Papan lingkungan</p>
              <h2 id="latest-announcement-heading">Pengumuman terbaru</h2>
            </div>
            <div className="section-heading__aside">
              <span>{unreadCopy}</span>
              <Link className="text-link" href="/pengumuman">
                Lihat semua
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {latestAnnouncement ? (
            <div className="home-primary-announcement">
              <AnnouncementRow announcement={latestAnnouncement} featured />
            </div>
          ) : (
            <StatePanel
              kind="empty"
              title="Belum ada pengumuman"
              description="Informasi terbaru dari pengurus akan muncul di sini."
            />
          )}
        </section>

        <div className="home-desk__aside">
          <aside className="household-pass" aria-labelledby="household-pass-heading">
            <div className="household-pass__heading">
              <p className="section-kicker">Rumah terdaftar</p>
              <h2 id="household-pass-heading">{home.household.house.code}</h2>
            </div>
            <dl className="household-pass__details">
              <div>
                <dt>Alamat</dt>
                <dd>{home.household.house.addressLabel}</dd>
              </div>
              <div>
                <dt>Rumah tangga</dt>
                <dd>{home.household.displayName}</dd>
              </div>
            </dl>
            <Link className="text-link household-pass__link" href="/akun">
              Lihat akun warga
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </aside>
          {canReadAgenda && (
            <section className="home-agenda-route" aria-labelledby="home-agenda-heading">
              <CalendarDays size={21} aria-hidden="true" />
              <div>
                <h2 id="home-agenda-heading">Agenda lingkungan</h2>
                {agendaPreviewQuery.isPending ? (
                  <span className="skeleton skeleton--line" aria-label="Memuat agenda terdekat" />
                ) : agendaPreviewQuery.isError ? (
                  <p>Jadwal terdekat belum bisa diperbarui.</p>
                ) : nextAgenda ? (
                  <div className="home-agenda-route__event">
                    <h3>{nextAgenda.title}</h3>
                    <p className="home-agenda-route__meta">
                      <span>
                        <CalendarDays size={14} aria-hidden="true" />
                        <time dateTime={nextAgenda.date}>{formatAgendaDate(nextAgenda.date)}</time>
                      </span>
                      <span>
                        <Clock3 size={14} aria-hidden="true" />
                        {formatAgendaTimeRange(nextAgenda.startTime, nextAgenda.endTime)}
                      </span>
                      <span>
                        <MapPin size={14} aria-hidden="true" />
                        {nextAgenda.location}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p>Belum ada kegiatan mendatang yang diterbitkan.</p>
                )}
              </div>
              <Link
                className="text-link"
                href={nextAgenda ? `/agenda/${nextAgenda.id}` : "/agenda"}
              >
                {nextAgenda ? "Lihat detail" : "Buka agenda"}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
