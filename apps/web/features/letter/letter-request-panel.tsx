"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLetterRequestInputSchema,
  type CreateLetterRequestInput,
  type LetterRequest,
  type LetterRequestStatus,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { AnnouncementListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { createLetterRequest, letterKeys, listLetterRequests, listLetterTypes } from "./letter-api";

const statusLabels: Record<LetterRequestStatus, string> = {
  SUBMITTED: "Diajukan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  READY: "Dokumen siap",
};

const statusBadgeVariant: Record<LetterRequestStatus, string> = {
  SUBMITTED: "status-label--muted",
  APPROVED: "status-label--warning",
  READY: "status-label--success",
  REJECTED: "status-label--danger",
};

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function formatLetterDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function LetterTypeSelectField({ form }: { form: UseFormReturn<CreateLetterRequestInput> }) {
  const typesQuery = useQuery({ queryKey: letterKeys.types, queryFn: listLetterTypes });
  const selectedTypeId = form.watch("letterTypeId");

  if (typesQuery.isPending) {
    return (
      <p className="loading-notice" aria-live="polite">
        <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
        Memuat jenis surat…
      </p>
    );
  }

  if (typesQuery.isError) {
    const state = getRequestState(typesQuery.error);
    return (
      <StatePanel
        kind={state === "offline" ? "offline" : "error"}
        title="Jenis surat belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar jenis surat."
        onRetry={() => void typesQuery.refetch()}
      />
    );
  }

  const types = typesQuery.data.data.items;
  const selectedType = types.find((type) => type.id === selectedTypeId);

  return (
    <div className="field">
      <label htmlFor="letter-type">Jenis surat</label>
      <select
        className="input"
        id="letter-type"
        aria-invalid={Boolean(form.formState.errors.letterTypeId)}
        aria-describedby={
          form.formState.errors.letterTypeId ? "letter-type-error" : "letter-type-hint"
        }
        {...form.register("letterTypeId")}
      >
        <option value="">Pilih jenis surat</option>
        {types.map((type) => (
          <option value={type.id} key={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      {form.formState.errors.letterTypeId ? (
        <p className="field-error" id="letter-type-error" role="alert">
          Pilih jenis surat terlebih dahulu.
        </p>
      ) : (
        <p className="field-hint" id="letter-type-hint">
          {selectedType?.description ?? "Pilih jenis surat untuk melihat keterangannya."}
        </p>
      )}
    </div>
  );
}

function LetterRequestForm() {
  const queryClient = useQueryClient();
  const form = useForm<CreateLetterRequestInput>({
    resolver: zodResolver(createLetterRequestInputSchema),
    defaultValues: { letterTypeId: "", purpose: "" },
  });

  const createMutation = useMutation({
    mutationFn: createLetterRequest,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: letterKeys.all });
      form.reset({ letterTypeId: "", purpose: "" });
    },
  });

  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
      noValidate
    >
      <LetterTypeSelectField form={form} />

      <div className="field">
        <label htmlFor="letter-purpose">Keperluan</label>
        <textarea
          className="input textarea"
          id="letter-purpose"
          rows={4}
          aria-invalid={Boolean(form.formState.errors.purpose)}
          aria-describedby={
            form.formState.errors.purpose ? "letter-purpose-error" : "letter-purpose-hint"
          }
          {...form.register("purpose")}
        />
        {form.formState.errors.purpose ? (
          <p className="field-error" id="letter-purpose-error" role="alert">
            Tulis keperluan permohonan, minimal 3 karakter.
          </p>
        ) : (
          <p className="field-hint" id="letter-purpose-hint">
            Jelaskan singkat untuk keperluan apa surat ini kamu perlukan.
          </p>
        )}
      </div>

      {createMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(createMutation.error)}
        </p>
      )}

      {createMutation.isSuccess && (
        <p className="form-message form-message--success" role="status">
          Permohonan terkirim. Pengurus lingkungan akan meninjau surat ini.
        </p>
      )}

      <p className="field-hint">
        Surat yang diterbitkan melalui Komplekku adalah surat keterangan dari pengurus
        lingkungan, bukan dokumen resmi pemerintah.
      </p>

      <button
        className="button button--primary"
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <>
            <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
            Mengirim permohonan…
          </>
        ) : (
          "Ajukan permohonan"
        )}
      </button>
    </form>
  );
}

function LetterRequestHistoryRow({ request }: { request: LetterRequest }) {
  return (
    <article className="letter-request-row">
      <div className="letter-request-row__header">
        <h3>{request.letterTypeName}</h3>
        <span className={`status-label ${statusBadgeVariant[request.status]}`}>
          {statusLabels[request.status]}
        </span>
      </div>
      <p className="letter-request-row__meta">{request.purpose}</p>
      <p className="letter-request-row__meta">
        Diajukan {formatLetterDateTime(request.createdAt)}
      </p>
      {request.status === "REJECTED" && request.rejectionReason && (
        <p className="letter-request-row__note letter-request-row__note--danger">
          Alasan penolakan: {request.rejectionReason}
        </p>
      )}
      {request.status === "READY" && (
        <p className="letter-request-row__note letter-request-row__note--success">
          Dokumen siap diambil di sekretariat pengurus.
        </p>
      )}
    </article>
  );
}

function LetterRequestHistory() {
  const historyQuery = useQuery({
    queryKey: letterKeys.list(undefined),
    queryFn: () => listLetterRequests(),
  });

  if (historyQuery.isPending) return <AnnouncementListSkeleton />;

  if (historyQuery.isError) {
    const state = getRequestState(historyQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat riwayat permohonan surat."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Riwayat surat tidak dapat diakses"
          description="Izin akunmu tidak mencakup riwayat permohonan surat."
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Riwayat permohonan belum dapat diperbarui."
          onRetry={() => void historyQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Riwayat surat belum bisa dimuat"
        description="Terjadi kendala saat mengambil riwayat permohonan surat."
        onRetry={() => void historyQuery.refetch()}
      />
    );
  }

  if (!historyQuery.data) return <AnnouncementListSkeleton />;

  const requests = historyQuery.data.data.items;

  if (requests.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada permohonan surat"
        description="Permohonan surat yang kamu ajukan akan muncul di sini."
      />
    );
  }

  return (
    <div className="letter-request-list">
      {requests.map((request) => (
        <LetterRequestHistoryRow request={request} key={request.id} />
      ))}
    </div>
  );
}

export function LetterRequestPanel() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("letter.read") ?? false;
  const canCreate = meQuery.data?.data.permissions.includes("letter.create") ?? false;

  if (meQuery.isPending) return <AnnouncementListSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk mengajukan dan melihat permohonan surat."
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
        description="Terjadi kendala saat mengambil informasi akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canRead) {
    return (
      <StatePanel
        kind="forbidden"
        title="Permohonan surat tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat permohonan surat."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  return (
    <div className="letter-panel">
      {canCreate && (
        <section aria-labelledby="letter-form-heading">
          <div className="section-heading">
            <h2 id="letter-form-heading">Ajukan surat baru</h2>
          </div>
          <LetterRequestForm />
        </section>
      )}

      <section aria-labelledby="letter-history-heading">
        <div className="section-heading">
          <h2 id="letter-history-heading">Riwayat permohonanmu</h2>
        </div>
        <LetterRequestHistory />
      </section>
    </div>
  );
}
