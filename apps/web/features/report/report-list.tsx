"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createReportInputSchema,
  type CreateReportInput,
  type ReportCategory,
  type ReportStatus,
  type ReportSummary,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { StatePanel } from "@/components/ui/state-panel";
import { PhotoPicker } from "@/components/ui/photo-picker";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { createReport, listReports, reportKeys } from "./report-api";

export const reportCategoryLabels: Record<ReportCategory, string> = {
  STREET_LIGHT: "Lampu Jalan",
  TRASH: "Sampah",
  DRAINAGE: "Drainase",
  SECURITY: "Keamanan",
  FACILITY: "Fasilitas",
  CLEANLINESS: "Kebersihan",
  NOISE: "Kebisingan",
  OTHER: "Lainnya",
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  SUBMITTED: "Dikirim",
  RECEIVED: "Diterima",
  IN_PROGRESS: "Diproses",
  COMPLETED: "Selesai",
};

export function reportStatusTone(status: ReportStatus) {
  if (status === "COMPLETED") return "success";
  if (status === "RECEIVED" || status === "IN_PROGRESS") return "warning";
  return "muted";
}

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

function CreateReportForm() {
  const queryClient = useQueryClient();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const form = useForm<CreateReportInput>({
    resolver: zodResolver(createReportInputSchema),
    defaultValues: {
      category: "STREET_LIGHT",
      description: "",
      location: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createReport,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
      form.reset();
      setPhotoUrls([]);
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    createMutation.mutate({ ...values, photoUrls: photoUrls.length > 0 ? photoUrls : undefined });
  });

  const isPending = createMutation.isPending || isUploadingPhotos;

  return (
    <form
      className="form-stack report-create-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="field">
        <label htmlFor="report-category">Kategori</label>
        <select className="input" id="report-category" {...form.register("category")}>
          {Object.entries(reportCategoryLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="report-description">Deskripsi</label>
        <textarea
          className="input textarea"
          id="report-description"
          rows={4}
          aria-invalid={Boolean(form.formState.errors.description)}
          aria-describedby={
            form.formState.errors.description ? "report-description-error" : undefined
          }
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="field-error" id="report-description-error" role="alert">
            Jelaskan masalahnya, minimal 3 karakter.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="report-location">Lokasi (opsional)</label>
        <input
          className="input"
          id="report-location"
          type="text"
          {...form.register("location", { setValueAs: blankToUndefined })}
        />
      </div>

      {/* Photo Attachment */}
      <div className="field">
        <label>Foto Pendukung (opsional, maks. 5)</label>
        <PhotoPicker
          onChange={(urls) => {
            setPhotoUrls(urls);
            // Mark uploading if there are pending slots (tracked by PhotoPicker internally).
            // We use the onChange callback as the source of truth — if URLs count increases we're good.
          }}
          disabled={createMutation.isPending}
        />
      </div>

      {createMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(createMutation.error)}
        </p>
      )}
      {createMutation.isSuccess && (
        <p className="form-message form-message--success" role="status">
          Laporan berhasil dikirim.
        </p>
      )}

      <button className="button button--primary" type="submit" disabled={isPending}>
        {createMutation.isPending ? (
          <>
            <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
            Mengirim…
          </>
        ) : (
          "Kirim laporan"
        )}
      </button>
    </form>
  );
}

function ReportRow({ report }: { report: ReportSummary }) {
  return (
    <Link className="report-row" href={`/laporan/${report.id}`}>
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
      <p className="report-row__meta">{formatReportDateTime(report.createdAt)}</p>
    </Link>
  );
}

export function ReportList() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("report.read") ?? false;
  const canCreate = meQuery.data?.data.permissions.includes("report.create") ?? false;

  const reportsQuery = useQuery({
    queryKey: reportKeys.list(),
    queryFn: () => listReports(),
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
          description="Masuk untuk melihat dan membuat laporan masalah."
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
        title="Laporan tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat laporan masalah."
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
          description="Masuk kembali untuk membuka laporanmu."
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
        description="Terjadi kendala saat mengambil laporanmu."
        onRetry={() => void reportsQuery.refetch()}
      />
    );
  }

  if (!reportsQuery.data) return null;

  const reports = reportsQuery.data.data.items;

  return (
    <div className="report-index">
      {canCreate && <CreateReportForm />}

      {reports.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada laporan"
          description="Laporan yang kamu kirim akan muncul di daftar ini."
        />
      ) : (
        <div className="report-list">
          {reports.map((report) => (
            <ReportRow report={report} key={report.id} />
          ))}
        </div>
      )}
    </div>
  );
}
