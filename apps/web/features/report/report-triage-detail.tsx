"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  addReportUpdateInputSchema,
  type AddReportUpdateInput,
  type ReportStatus,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LoaderCircle, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { AgendaDetailSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { addReportUpdate, getReport, reportKeys } from "./report-api";
import { reportCategoryLabels, reportStatusLabels, reportStatusTone } from "./report-list";

const statusOptions: ReportStatus[] = ["SUBMITTED", "RECEIVED", "IN_PROGRESS", "COMPLETED"];

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function formatReportDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function blankToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function ReportTriageDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("report.manage") ?? false;

  const reportQuery = useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReport(id),
  });

  const updateForm = useForm<AddReportUpdateInput>({
    resolver: zodResolver(addReportUpdateInputSchema),
    values: reportQuery.data
      ? { status: reportQuery.data.data.report.status, note: "" }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (input: AddReportUpdateInput) => addReportUpdate(id, input),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });

  if (meQuery.isPending || reportQuery.isPending) return <AgendaDetailSkeleton />;

  if (reportQuery.isError) {
    const state = getRequestState(reportQuery.error);
    if (reportQuery.error instanceof ApiError && reportQuery.error.status === 404) {
      return (
        <StatePanel
          kind="empty"
          title="Laporan tidak ditemukan"
          description="Laporan mungkin sudah dihapus atau alamatnya tidak tepat."
          headingLevel={1}
          actionHref="/admin/laporan"
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
          actionHref="/admin/laporan"
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
      <Link className="text-link" href="/admin/laporan">
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
        <dl className="report-detail__facts">
          {report.location && (
            <div>
              <dt>
                <MapPin size={17} aria-hidden="true" />
                Lokasi
              </dt>
              <dd>{report.location}</dd>
            </div>
          )}
          <div>
            <dt>
              <UserRound size={17} aria-hidden="true" />
              Pelapor
            </dt>
            <dd>
              {report.reporterName} · {report.houseCode}
            </dd>
          </div>
        </dl>
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
              {update.actorName && (
                <p className="report-timeline__meta">Oleh {update.actorName}</p>
              )}
            </li>
          ))}
        </ol>
      </div>

      {canManage && (
        <section className="report-update-panel" aria-labelledby="report-update-heading">
          <h2 id="report-update-heading">Perbarui status laporan</h2>
          <form
            className="form-stack"
            onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}
            noValidate
          >
            <div className="field">
              <label htmlFor="report-update-status">Status</label>
              <select className="input" id="report-update-status" {...updateForm.register("status")}>
                {statusOptions.map((status) => (
                  <option value={status} key={status}>
                    {reportStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="report-update-note">Catatan (opsional)</label>
              <textarea
                className="input textarea"
                id="report-update-note"
                rows={4}
                {...updateForm.register("note", { setValueAs: blankToUndefined })}
              />
              <p className="field-hint">Catatan ini akan terlihat oleh warga pelapor.</p>
            </div>
            {updateMutation.isError && (
              <p className="form-message" role="alert">
                {readableError(updateMutation.error)}
              </p>
            )}
            {updateMutation.isSuccess && (
              <p className="form-message form-message--success" role="status">
                Status laporan berhasil diperbarui.
              </p>
            )}
            <button
              className="button button--primary"
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Menyimpan…
                </>
              ) : (
                "Simpan perubahan"
              )}
            </button>
          </form>
        </section>
      )}
    </article>
  );
}
