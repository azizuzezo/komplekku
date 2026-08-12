"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createIncidentInputSchema,
  type CreateIncidentInput,
  type IncidentCategory,
  type IncidentStatus,
  type IncidentSummary,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { createIncident, incidentKeys, listIncidents } from "./incident-api";

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

const statusFilters: Array<{ value: IncidentStatus | ""; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "OPEN", label: statusLabels.OPEN },
  { value: "IN_REVIEW", label: statusLabels.IN_REVIEW },
  { value: "RESOLVED", label: statusLabels.RESOLVED },
  { value: "CLOSED", label: statusLabels.CLOSED },
];

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

function toIsoDateTime(localValue: string) {
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function CreateIncidentForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [occurredAtLocal, setOccurredAtLocal] = useState("");
  const form = useForm<CreateIncidentInput>({
    resolver: zodResolver(createIncidentInputSchema),
    defaultValues: {
      category: "SECURITY",
      title: "",
      description: "",
      location: "",
      occurredAt: "",
      peopleInvolved: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createIncident,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.all });
      form.reset();
      setOccurredAtLocal("");
      onDone();
    },
  });

  return (
    <form
      className="form-stack incident-create-form"
      onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
      noValidate
    >
      <div className="field">
        <label htmlFor="incident-category">Kategori</label>
        <select className="input" id="incident-category" {...form.register("category")}>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="incident-title">Judul</label>
        <input
          className="input"
          id="incident-title"
          type="text"
          aria-invalid={Boolean(form.formState.errors.title)}
          aria-describedby={form.formState.errors.title ? "incident-title-error" : undefined}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="field-error" id="incident-title-error" role="alert">
            Tulis judul singkat, minimal 3 karakter.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="incident-description">Deskripsi</label>
        <textarea
          className="input textarea"
          id="incident-description"
          rows={4}
          aria-invalid={Boolean(form.formState.errors.description)}
          aria-describedby={
            form.formState.errors.description ? "incident-description-error" : undefined
          }
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="field-error" id="incident-description-error" role="alert">
            Jelaskan kejadian, minimal 3 karakter.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="incident-location">Lokasi (opsional)</label>
        <input
          className="input"
          id="incident-location"
          type="text"
          {...form.register("location", { setValueAs: blankToUndefined })}
        />
      </div>

      <div className="field">
        <label htmlFor="incident-occurred-at">Waktu kejadian</label>
        <input
          className="input"
          id="incident-occurred-at"
          type="datetime-local"
          value={occurredAtLocal}
          aria-invalid={Boolean(form.formState.errors.occurredAt)}
          aria-describedby={
            form.formState.errors.occurredAt ? "incident-occurred-at-error" : undefined
          }
          onChange={(event) => {
            setOccurredAtLocal(event.target.value);
            form.setValue("occurredAt", toIsoDateTime(event.target.value), {
              shouldValidate: true,
            });
          }}
        />
        {form.formState.errors.occurredAt && (
          <p className="field-error" id="incident-occurred-at-error" role="alert">
            Pilih tanggal dan waktu kejadian.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="incident-people">Pihak yang terlibat (opsional)</label>
        <textarea
          className="input textarea"
          id="incident-people"
          rows={3}
          {...form.register("peopleInvolved", { setValueAs: blankToUndefined })}
        />
      </div>

      {createMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(createMutation.error)}
        </p>
      )}

      <div className="incident-create-form__actions">
        <button className="button button--primary" type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
              Mengirim…
            </>
          ) : (
            "Kirim laporan"
          )}
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={onDone}
          disabled={createMutation.isPending}
        >
          Batal
        </button>
      </div>
    </form>
  );
}

function IncidentRow({ incident }: { incident: IncidentSummary }) {
  return (
    <Link className="incident-row" href={`/admin/keamanan/kejadian/${incident.id}`}>
      <div className="incident-row__header">
        <h2>{incident.title}</h2>
        <span className={`incident-status-badge incident-status-badge--${incident.status.toLowerCase()}`}>
          {statusLabels[incident.status]}
        </span>
      </div>
      <p className="incident-row__meta">
        {categoryLabels[incident.category]}
        {incident.location ? ` · ${incident.location}` : ""}
      </p>
      <p className="incident-row__meta">
        Dilaporkan oleh {incident.reporterName} · {formatIncidentDateTime(incident.occurredAt)}
      </p>
    </Link>
  );
}

export function IncidentList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [isCreating, setIsCreating] = useState(false);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("incident.read") ?? false;
  const canCreate = meQuery.data?.data.permissions.includes("incident.create") ?? false;

  const incidentsQuery = useQuery({
    queryKey: incidentKeys.list(statusFilter || undefined),
    queryFn: () => listIncidents(statusFilter || undefined),
    enabled: canRead,
  });

  if (meQuery.isPending || (canRead && incidentsQuery.isPending)) {
    return (
      <p className="loading-notice" aria-live="polite">
        <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
        Memuat laporan kejadian…
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
          description="Masuk untuk melihat laporan kejadian."
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
        title="Laporan kejadian tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat laporan kejadian."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (incidentsQuery.isError) {
    const state = getRequestState(incidentsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka laporan kejadian."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Laporan kejadian tidak dapat diakses"
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
          onRetry={() => void incidentsQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Laporan belum bisa dimuat"
        description="Terjadi kendala saat mengambil laporan kejadian."
        onRetry={() => void incidentsQuery.refetch()}
      />
    );
  }

  if (!incidentsQuery.data) return null;

  const incidents = incidentsQuery.data.data.items;

  return (
    <div className="incident-index">
      <div className="incident-index__toolbar">
        <div className="field incident-status-filter">
          <label htmlFor="incident-status-filter">Status</label>
          <select
            className="input"
            id="incident-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as IncidentStatus | "")}
          >
            {statusFilters.map((option) => (
              <option value={option.value} key={option.value || "all"}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {canCreate && !isCreating && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={17} aria-hidden="true" />
            Buat laporan
          </button>
        )}
      </div>

      {canCreate && isCreating && (
        <CreateIncidentForm
          onDone={() => {
            setIsCreating(false);
            void queryClient.invalidateQueries({ queryKey: incidentKeys.all });
          }}
        />
      )}

      {incidents.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada laporan kejadian"
          description="Laporan yang dibuat akan muncul di daftar ini."
        />
      ) : (
        <div className="incident-list">
          {incidents.map((incident) => (
            <IncidentRow incident={incident} key={incident.id} />
          ))}
        </div>
      )}
    </div>
  );
}
