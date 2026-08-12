"use client";

import type { ReportStatus, ReportSummary } from "@komplekku/contracts";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { listReports, reportKeys } from "./report-api";
import { reportCategoryLabels, reportStatusLabels, reportStatusTone } from "./report-list";

const statusFilters: Array<{ value: ReportStatus | ""; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "SUBMITTED", label: reportStatusLabels.SUBMITTED },
  { value: "RECEIVED", label: reportStatusLabels.RECEIVED },
  { value: "IN_PROGRESS", label: reportStatusLabels.IN_PROGRESS },
  { value: "COMPLETED", label: reportStatusLabels.COMPLETED },
];

function formatReportDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function ReportTriageRow({ report }: { report: ReportSummary }) {
  return (
    <Link className="report-row" href={`/admin/laporan/${report.id}`}>
      <div className="report-row__header">
        <h2>{reportCategoryLabels[report.category]}</h2>
        <span className={`status-label status-label--${reportStatusTone(report.status)}`}>
          {reportStatusLabels[report.status]}
        </span>
      </div>
      <p className="report-row__meta">
        {report.description}
        {report.location ? ` · ${report.location}` : ""}
      </p>
      <p className="report-row__meta">
        {report.reporterName} · {report.houseCode} · {formatReportDateTime(report.createdAt)}
      </p>
    </Link>
  );
}

export function ReportTriageList() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("report.read") ?? false;

  const reportsQuery = useQuery({
    queryKey: reportKeys.list(statusFilter || undefined),
    queryFn: () => listReports(statusFilter || undefined),
    enabled: canRead,
  });

  if (meQuery.isPending || (canRead && reportsQuery.isPending)) {
    return (
      <p className="loading-notice" aria-live="polite">
        <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
        Memuat laporan…
      </p>
    );
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk mengelola laporan warga."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Izin akun belum dapat diperiksa."
          onRetry={() => void meQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Izin akun belum bisa diperiksa"
        description="Terjadi kendala saat mengambil informasi akun."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canRead) {
    return (
      <StatePanel
        kind="forbidden"
        title="Laporan warga tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mengelola laporan warga."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (reportsQuery.isError) {
    const state = getRequestState(reportsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka daftar laporan warga."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Laporan warga tidak dapat diakses"
          description="Izin akunmu tidak mencakup daftar laporan ini."
          actionHref="/"
          actionLabel="Ke beranda"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar laporan belum dapat diperbarui."
          onRetry={() => void reportsQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Laporan belum bisa dimuat"
        description="Terjadi kendala saat mengambil laporan warga."
        onRetry={() => void reportsQuery.refetch()}
      />
    );
  }

  if (!reportsQuery.data) return null;

  const reports = reportsQuery.data.data.items;

  return (
    <div className="report-index">
      <div className="report-index__toolbar">
        <div className="field report-status-filter">
          <label htmlFor="report-status-filter">Status</label>
          <select
            className="input"
            id="report-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ReportStatus | "")}
          >
            {statusFilters.map((option) => (
              <option value={option.value} key={option.value || "all"}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reports.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada laporan"
          description="Laporan yang dikirim warga akan muncul di daftar ini."
        />
      ) : (
        <div className="report-list">
          {reports.map((report) => (
            <ReportTriageRow report={report} key={report.id} />
          ))}
        </div>
      )}
    </div>
  );
}
