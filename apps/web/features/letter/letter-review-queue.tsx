"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  rejectLetterRequestInputSchema,
  type LetterRequest,
  type LetterRequestStatus,
  type RejectLetterRequestInput,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  approveLetterRequest,
  letterKeys,
  listLetterRequests,
  markLetterRequestReady,
  rejectLetterRequest,
} from "./letter-api";

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

const statusFilters: Array<{ value: LetterRequestStatus | ""; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "SUBMITTED", label: statusLabels.SUBMITTED },
  { value: "APPROVED", label: statusLabels.APPROVED },
  { value: "READY", label: statusLabels.READY },
  { value: "REJECTED", label: statusLabels.REJECTED },
];

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permohonan belum dapat diproses. Silakan coba lagi.";
}

function formatLetterDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

type ReviewMode = "reject" | null;

function LetterReviewRow({ request, canManage }: { request: LetterRequest; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const rejectForm = useForm<RejectLetterRequestInput>({
    resolver: zodResolver(rejectLetterRequestInputSchema),
    defaultValues: { reason: "" },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveLetterRequest(request.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: letterKeys.all });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (input: RejectLetterRequestInput) => rejectLetterRequest(request.id, input),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: letterKeys.all });
      rejectForm.reset();
      setReviewMode(null);
    },
  });

  const readyMutation = useMutation({
    mutationFn: () => markLetterRequestReady(request.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: letterKeys.all });
    },
  });

  const isPending =
    approveMutation.isPending || rejectMutation.isPending || readyMutation.isPending;
  const actionError = approveMutation.error ?? rejectMutation.error ?? readyMutation.error;

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
        {request.requesterName} · {request.houseCode} · Diajukan{" "}
        {formatLetterDateTime(request.createdAt)}
      </p>
      {request.status === "REJECTED" && request.rejectionReason && (
        <p className="letter-request-row__note letter-request-row__note--danger">
          Alasan penolakan: {request.rejectionReason}
        </p>
      )}
      {request.status === "READY" && (
        <p className="letter-request-row__note letter-request-row__note--success">
          Dokumen siap diambil.
        </p>
      )}

      {canManage && actionError && (
        <p className="form-message" role="alert">
          {readableError(actionError)}
        </p>
      )}

      {canManage && request.status === "SUBMITTED" && reviewMode === null && (
        <div className="letter-request-row__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => approveMutation.mutate()}
            disabled={isPending}
          >
            {approveMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                Menyetujui…
              </>
            ) : (
              <>
                <Check size={17} aria-hidden="true" />
                Setujui
              </>
            )}
          </button>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setReviewMode("reject")}
            disabled={isPending}
          >
            <X size={17} aria-hidden="true" />
            Tolak
          </button>
        </div>
      )}

      {canManage && request.status === "SUBMITTED" && reviewMode === "reject" && (
        <form
          className="letter-review-panel"
          onSubmit={rejectForm.handleSubmit((input) => rejectMutation.mutate(input))}
          noValidate
        >
          <div className="field">
            <label htmlFor={`letter-reject-reason-${request.id}`}>Alasan penolakan</label>
            <textarea
              className="input textarea"
              id={`letter-reject-reason-${request.id}`}
              rows={3}
              maxLength={500}
              aria-invalid={Boolean(rejectForm.formState.errors.reason)}
              aria-describedby={
                rejectForm.formState.errors.reason
                  ? `letter-reject-reason-error-${request.id}`
                  : `letter-reject-reason-hint-${request.id}`
              }
              {...rejectForm.register("reason")}
            />
            {rejectForm.formState.errors.reason ? (
              <p
                className="field-error"
                id={`letter-reject-reason-error-${request.id}`}
                role="alert"
              >
                Tulis alasan penolakan, minimal 3 karakter.
              </p>
            ) : (
              <p className="field-hint" id={`letter-reject-reason-hint-${request.id}`}>
                Alasan ini akan terlihat oleh warga yang mengajukan.
              </p>
            )}
          </div>
          <div className="letter-request-row__actions">
            <button className="button button--danger" type="submit" disabled={isPending}>
              {rejectMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Menolak…
                </>
              ) : (
                "Konfirmasi penolakan"
              )}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => {
                rejectMutation.reset();
                rejectForm.reset();
                setReviewMode(null);
              }}
              disabled={isPending}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {canManage && request.status === "APPROVED" && (
        <div className="letter-request-row__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => readyMutation.mutate()}
            disabled={isPending}
          >
            {readyMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                Menandai…
              </>
            ) : (
              "Tandai siap"
            )}
          </button>
        </div>
      )}
    </article>
  );
}

export function LetterReviewQueue() {
  const [statusFilter, setStatusFilter] = useState<LetterRequestStatus | "">("");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("letter.read") ?? false;
  const canManage = meQuery.data?.data.permissions.includes("letter.manage") ?? false;

  const requestsQuery = useQuery({
    queryKey: letterKeys.list(statusFilter || undefined),
    queryFn: () => listLetterRequests(statusFilter || undefined, 50),
    enabled: canRead,
  });

  if (meQuery.isPending || (canRead && requestsQuery.isPending)) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk meninjau permohonan surat."
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
        description="Terjadi kendala saat mengambil informasi akun pengurus."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canRead) {
    return (
      <StatePanel
        kind="forbidden"
        title="Tinjauan surat tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk meninjau permohonan surat."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (requestsQuery.isError) {
    const state = getRequestState(requestsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk meninjau permohonan surat."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Tinjauan surat tidak dapat diakses"
          description="Izin akunmu tidak mencakup daftar permohonan surat."
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
          description="Daftar permohonan belum dapat diperbarui."
          onRetry={() => void requestsQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Daftar permohonan belum bisa dimuat"
        description="Terjadi kendala saat mengambil permohonan surat."
        onRetry={() => void requestsQuery.refetch()}
      />
    );
  }

  if (!requestsQuery.data) return <AdminQueueSkeleton />;

  const requests = requestsQuery.data.data.items;

  return (
    <div className="letter-panel">
      <div className="letter-review-toolbar">
        <div className="field letter-review-filter">
          <label htmlFor="letter-status-filter">Status</label>
          <select
            className="input"
            id="letter-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as LetterRequestStatus | "")}
          >
            {statusFilters.map((option) => (
              <option value={option.value} key={option.value || "all"}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {requests.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Tidak ada permohonan surat"
          description="Permohonan surat warga akan muncul di daftar ini."
        />
      ) : (
        <div className="letter-request-list">
          {requests.map((request) => (
            <LetterReviewRow request={request} canManage={canManage} key={request.id} />
          ))}
        </div>
      )}
    </div>
  );
}
