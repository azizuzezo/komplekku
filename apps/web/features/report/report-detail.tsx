"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";

import { AgendaDetailSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { ApiError, getRequestState } from "@/lib/api/client";

import { getReport, reportKeys } from "./report-api";
import { reportCategoryLabels, reportStatusLabels, reportStatusTone } from "./report-list";

function formatReportDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function ReportDetail({ id }: { id: string }) {
  const reportQuery = useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReport(id),
  });

  if (reportQuery.isPending) return <AgendaDetailSkeleton />;

  if (reportQuery.isError) {
    const state = getRequestState(reportQuery.error);
    if (reportQuery.error instanceof ApiError && reportQuery.error.status === 404) {
      return (
        <StatePanel
          kind="empty"
          title="Laporan tidak ditemukan"
          description="Laporan mungkin sudah dihapus atau alamatnya tidak tepat."
          headingLevel={1}
          actionHref="/laporan"
          actionLabel="Kembali ke daftar laporan"
        />
      );
    }
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat laporan ini."
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
          title="Laporan tidak dapat diakses"
          description="Akunmu belum memiliki izin untuk melihat laporan ini."
          headingLevel={1}
          actionHref="/laporan"
          actionLabel="Kembali ke daftar laporan"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Laporan ini belum tersedia secara offline."
          headingLevel={1}
          onRetry={() => void reportQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Laporan belum bisa dimuat"
        description="Terjadi kendala saat mengambil detail laporan."
        headingLevel={1}
        onRetry={() => void reportQuery.refetch()}
      />
    );
  }

  const report = reportQuery.data.data.report;

  return (
    <article className="report-detail">
      <Link className="text-link" href="/laporan">
        <ArrowLeft size={16} aria-hidden="true" />
        Semua laporan
      </Link>
      <header>
        <p className="section-kicker">{reportCategoryLabels[report.category]}</p>
        <div className="report-detail__title-row">
          <h1>{reportCategoryLabels[report.category]}</h1>
          <span className={`status-label status-label--${reportStatusTone(report.status)}`}>
            {reportStatusLabels[report.status]}
          </span>
        </div>
        {report.location && (
          <dl className="report-detail__facts">
            <div>
              <dt>
                <MapPin size={17} aria-hidden="true" />
                Lokasi
              </dt>
              <dd>{report.location}</dd>
            </div>
          </dl>
        )}
      </header>

      <div className="report-detail__body">
        <h2>Deskripsi</h2>
        <p>{report.description}</p>
      </div>

      <div className="report-detail__body">
        <h2>Riwayat status</h2>
        <ol className="report-timeline">
          {report.updates.map((update) => (
            <li className="report-timeline__item" key={update.id}>
              <div className="report-timeline__header">
                <span className={`status-label status-label--${reportStatusTone(update.status)}`}>
                  {reportStatusLabels[update.status]}
                </span>
                <p className="report-timeline__meta">{formatReportDateTime(update.createdAt)}</p>
              </div>
              {update.note && <p className="report-timeline__note">{update.note}</p>}
              {update.actorName && <p className="report-timeline__meta">Oleh {update.actorName}</p>}
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
