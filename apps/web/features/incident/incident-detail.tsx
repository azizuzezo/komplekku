"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateIncidentInputSchema,
  type IncidentCategory,
  type IncidentStatus,
  type UpdateIncidentInput,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, LoaderCircle, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { AgendaDetailSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { getIncident, incidentKeys, updateIncident } from "./incident-api";

const categoryLabels: Record<IncidentCategory, string> = {
  SECURITY: "Keamanan",
  SUSPICIOUS_ACTIVITY: "Aktivitas mencurigakan",
  DAMAGE: "Kerusakan",
  NOISE: "Kebisingan",
  TRAFFIC: "Lalu lintas",
  LOST_ITEM: "Barang hilang",
  EMERGENCY: "Darurat",
  OTHER: "Lainnya",
};

const statusLabels: Record<IncidentStatus, string> = {
  OPEN: "Terbuka",
  IN_REVIEW: "Ditinjau",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

const statusOptions: IncidentStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function formatIncidentDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function blankToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function IncidentDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("incident.manage") ?? false;

  const incidentQuery = useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => getIncident(id),
  });

  const updateForm = useForm<UpdateIncidentInput>({
    resolver: zodResolver(updateIncidentInputSchema),
    values: incidentQuery.data
      ? {
          status: incidentQuery.data.data.incident.status,
          actionTaken: incidentQuery.data.data.incident.actionTaken ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateIncidentInput) => updateIncident(id, input),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.all });
    },
  });

  if (meQuery.isPending || incidentQuery.isPending) return <AgendaDetailSkeleton />;

  if (incidentQuery.isError) {
    const state = getRequestState(incidentQuery.error);
    if (incidentQuery.error instanceof ApiError && incidentQuery.error.status === 404) {
      return (
        <StatePanel
          kind="empty"
          title="Laporan tidak ditemukan"
          description="Laporan kejadian mungkin sudah dihapus atau alamatnya tidak tepat."
          headingLevel={1}
          actionHref="/admin/keamanan/kejadian"
          actionLabel="Kembali ke daftar laporan"
        />
      );
    }
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat laporan kejadian ini."
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
          actionHref="/admin/keamanan/kejadian"
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
          onRetry={() => void incidentQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Laporan belum bisa dimuat"
        description="Terjadi kendala saat mengambil detail laporan."
        headingLevel={1}
        onRetry={() => void incidentQuery.refetch()}
      />
    );
  }

  const incident = incidentQuery.data.data.incident;

  return (
    <article className="incident-detail">
      <Link className="text-link" href="/admin/keamanan/kejadian">
        <ArrowLeft size={16} aria-hidden="true" />
        Semua laporan kejadian
      </Link>
      <header>
        <p className="section-kicker">{categoryLabels[incident.category]}</p>
        <div className="incident-detail__title-row">
          <h1>{incident.title}</h1>
          <span
            className={`incident-status-badge incident-status-badge--${incident.status.toLowerCase()}`}
          >
            {statusLabels[incident.status]}
          </span>
        </div>
        <dl className="incident-detail__facts">
          <div>
            <dt>
              <CalendarClock size={17} aria-hidden="true" />
              Waktu kejadian
            </dt>
            <dd>{formatIncidentDateTime(incident.occurredAt)}</dd>
          </div>
          {incident.location && (
            <div>
              <dt>
                <MapPin size={17} aria-hidden="true" />
                Lokasi
              </dt>
              <dd>{incident.location}</dd>
            </div>
          )}
          <div>
            <dt>
              <UserRound size={17} aria-hidden="true" />
              Pelapor
            </dt>
            <dd>{incident.reporterName}</dd>
          </div>
        </dl>
      </header>

      <div className="incident-detail__body">
        <h2>Deskripsi</h2>
        <p>{incident.description}</p>
      </div>

      {incident.peopleInvolved && (
        <div className="incident-detail__body">
          <h2>Pihak yang terlibat</h2>
          <p>{incident.peopleInvolved}</p>
        </div>
      )}

      {incident.actionTaken && (
        <div className="incident-detail__body">
          <h2>Tindakan yang diambil</h2>
          <p>{incident.actionTaken}</p>
        </div>
      )}

      {canManage && (
        <section className="incident-update-panel" aria-labelledby="incident-update-heading">
          <h2 id="incident-update-heading">Perbarui laporan</h2>
          <form
            className="form-stack"
            onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}
            noValidate
          >
            <div className="field">
              <label htmlFor="incident-update-status">Status</label>
              <select
                className="input"
                id="incident-update-status"
                {...updateForm.register("status")}
              >
                {statusOptions.map((status) => (
                  <option value={status} key={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="incident-update-action">Tindakan yang diambil</label>
              <textarea
                className="input textarea"
                id="incident-update-action"
                rows={4}
                {...updateForm.register("actionTaken", { setValueAs: blankToUndefined })}
              />
              <p className="field-hint">Catat tindakan pengurus atau petugas keamanan.</p>
            </div>
            {updateMutation.isError && (
              <p className="form-message" role="alert">
                {readableError(updateMutation.error)}
              </p>
            )}
            {updateMutation.isSuccess && (
              <p className="form-message form-message--success" role="status">
                Laporan berhasil diperbarui.
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
