"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEmergencyInputSchema,
  type CreateEmergencyInput,
  type Emergency,
  type EmergencyKind,
} from "@komplekku/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";

import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api/client";

import { createEmergency } from "./emergency-api";

const kindOptions: Array<{ value: EmergencyKind; label: string }> = [
  { value: "SECURITY", label: "Keamanan" },
  { value: "MEDICAL", label: "Medis" },
  { value: "FIRE", label: "Kebakaran" },
  { value: "ENVIRONMENTAL", label: "Lingkungan" },
  { value: "OTHER", label: "Lainnya" },
];

const statusLabels: Record<Emergency["status"], string> = {
  SENT: "Terkirim",
  ACKNOWLEDGED: "Diterima petugas",
  RESPONDING: "Petugas menuju lokasi",
  RESOLVED: "Selesai ditangani",
};

function formatSentAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Sinyal darurat belum dapat dikirim. Silakan coba lagi.";
}

export function EmergencySosPanel() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canSendEmergency = meQuery.data?.data.permissions.includes("emergency.create") ?? false;

  const form = useForm<CreateEmergencyInput>({
    resolver: zodResolver(createEmergencyInputSchema),
    defaultValues: { kind: "SECURITY", note: "" },
  });

  const sendMutation = useMutation({
    mutationFn: createEmergency,
  });

  if (meQuery.isPending) {
    return (
      <div className="emergency-sos-panel" aria-busy="true">
        <span className="visually-hidden">Memuat data</span>
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <StatePanel
        kind="error"
        title="Sinyal darurat belum bisa disiapkan"
        description="Terjadi kendala saat memeriksa izin akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canSendEmergency) {
    return (
      <StatePanel
        kind="forbidden"
        title="Sinyal darurat tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mengirim sinyal darurat."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (sendMutation.isSuccess) {
    const emergency = sendMutation.data.data.emergency;
    return (
      <div className="emergency-sos-panel">
        <div className="emergency-confirmation" role="status">
          <h2>Sinyal darurat terkirim</h2>
          <dl className="emergency-confirmation__facts">
            <div>
              <dt>Status</dt>
              <dd>{statusLabels[emergency.status]}</dd>
            </div>
            <div>
              <dt>Rumah</dt>
              <dd>{emergency.houseLabel}</dd>
            </div>
            <div>
              <dt>Waktu kirim</dt>
              <dd>{formatSentAt(emergency.sentAt)}</dd>
            </div>
          </dl>
          <p>Petugas keamanan telah diberi tahu.</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              sendMutation.reset();
              form.reset({ kind: "SECURITY", note: "" });
            }}
          >
            Kirim sinyal baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-sos-panel">
      <form
        className="form-stack"
        onSubmit={form.handleSubmit((values) => sendMutation.mutate(values))}
        noValidate
      >
        <div className="field">
          <label htmlFor="emergency-kind">Jenis kedaruratan</label>
          <select
            className="input"
            id="emergency-kind"
            aria-invalid={Boolean(form.formState.errors.kind)}
            {...form.register("kind")}
          >
            {kindOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="emergency-note">Catatan singkat (opsional)</label>
          <textarea
            className="input textarea"
            id="emergency-note"
            rows={3}
            maxLength={500}
            placeholder="Contoh: ada asap di dapur"
            aria-invalid={Boolean(form.formState.errors.note)}
            aria-describedby="emergency-note-hint"
            {...form.register("note")}
          />
          <p className="field-hint" id="emergency-note-hint">
            Catatan membantu petugas memahami situasi lebih cepat.
          </p>
        </div>

        {sendMutation.isError && (
          <p className="form-message" role="alert">
            {readableError(sendMutation.error)}
          </p>
        )}

        <button
          className="button button--danger button--full emergency-sos-panel__submit"
          type="submit"
          disabled={sendMutation.isPending}
        >
          {sendMutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Mengirim sinyal…
            </>
          ) : (
            <>
              <TriangleAlert size={18} aria-hidden="true" />
              Kirim Sinyal Darurat
            </>
          )}
        </button>
      </form>
    </div>
  );
}
