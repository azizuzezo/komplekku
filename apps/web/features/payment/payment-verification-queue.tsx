"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  rejectPaymentInputSchema,
  type Payment,
  type PaymentStatus,
  type RejectPaymentInput,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { listPayments, paymentKeys, rejectPayment, verifyPayment } from "./payment-api";

const statusLabels: Record<PaymentStatus, string> = {
  PENDING: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

const statusBadgeVariant: Record<PaymentStatus, string> = {
  PENDING: "status-label--warning",
  VERIFIED: "status-label--success",
  REJECTED: "status-label--danger",
};

const statusFilters: Array<{ value: PaymentStatus | ""; label: string }> = [
  { value: "PENDING", label: statusLabels.PENDING },
  { value: "VERIFIED", label: statusLabels.VERIFIED },
  { value: "REJECTED", label: statusLabels.REJECTED },
  { value: "", label: "Semua status" },
];

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function formatRupiah(amount: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
}

function formatPaidAt(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type ReviewMode = "reject" | null;

function PaymentReviewRow({ payment, canManage }: { payment: Payment; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const rejectForm = useForm<RejectPaymentInput>({
    resolver: zodResolver(rejectPaymentInputSchema),
    defaultValues: { reason: "" },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyPayment(payment.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (input: RejectPaymentInput) => rejectPayment(payment.id, input),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      rejectForm.reset();
      setReviewMode(null);
    },
  });

  const isPending = verifyMutation.isPending || rejectMutation.isPending;
  const actionError = verifyMutation.error ?? rejectMutation.error;

  return (
    <article className="payment-row">
      <div className="payment-row__header">
        <h3>
          {payment.duesTypeName} · {payment.period}
        </h3>
        <span className={`status-label ${statusBadgeVariant[payment.status]}`}>
          {statusLabels[payment.status]}
        </span>
      </div>
      <p className="payment-row__meta payment-row__meta--amount">{formatRupiah(payment.amount)}</p>
      <p className="payment-row__meta">
        {payment.submittedByName} · {payment.houseCode} · {payment.householdDisplayName}
      </p>
      <p className="payment-row__meta">Transfer {formatPaidAt(payment.paidAt)}</p>
      <p className="payment-row__meta">{payment.note}</p>
      {payment.status === "VERIFIED" && (
        <p className="payment-row__note payment-row__note--success">
          Diverifikasi oleh {payment.verifiedByName ?? "bendahara"}
          {payment.receiptNumber ? ` · No. kuitansi ${payment.receiptNumber}` : ""}
        </p>
      )}
      {payment.status === "REJECTED" && payment.rejectionReason && (
        <p className="payment-row__note payment-row__note--danger">
          Alasan penolakan: {payment.rejectionReason}
        </p>
      )}

      {canManage && actionError && (
        <p className="form-message" role="alert">
          {readableError(actionError)}
        </p>
      )}

      {canManage && payment.status === "PENDING" && reviewMode === null && (
        <div className="payment-row__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => verifyMutation.mutate()}
            disabled={isPending}
          >
            {verifyMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                Memverifikasi…
              </>
            ) : (
              <>
                <Check size={17} aria-hidden="true" />
                Verifikasi
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

      {canManage && payment.status === "PENDING" && reviewMode === "reject" && (
        <form
          className="payment-review-panel"
          onSubmit={rejectForm.handleSubmit((input) => rejectMutation.mutate(input))}
          noValidate
        >
          <div className="field">
            <label htmlFor={`payment-reject-reason-${payment.id}`}>Alasan penolakan</label>
            <textarea
              className="input textarea"
              id={`payment-reject-reason-${payment.id}`}
              rows={3}
              maxLength={500}
              aria-invalid={Boolean(rejectForm.formState.errors.reason)}
              aria-describedby={
                rejectForm.formState.errors.reason
                  ? `payment-reject-reason-error-${payment.id}`
                  : `payment-reject-reason-hint-${payment.id}`
              }
              {...rejectForm.register("reason")}
            />
            {rejectForm.formState.errors.reason ? (
              <p
                className="field-error"
                id={`payment-reject-reason-error-${payment.id}`}
                role="alert"
              >
                Tulis alasan penolakan, minimal 3 karakter.
              </p>
            ) : (
              <p className="field-hint" id={`payment-reject-reason-hint-${payment.id}`}>
                Alasan ini akan terlihat oleh warga yang mengajukan.
              </p>
            )}
          </div>
          <div className="payment-row__actions">
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
    </article>
  );
}

export function PaymentVerificationQueue() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("PENDING");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canVerify = meQuery.data?.data.permissions.includes("payment.verify") ?? false;

  const paymentsQuery = useQuery({
    queryKey: paymentKeys.queue(statusFilter || undefined),
    queryFn: () => listPayments(statusFilter || undefined, 50),
    enabled: canVerify,
  });

  if (meQuery.isPending || (canVerify && paymentsQuery.isPending)) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk memverifikasi pembayaran."
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

  if (!canVerify) {
    return (
      <StatePanel
        kind="forbidden"
        title="Verifikasi pembayaran tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk memverifikasi pembayaran warga."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (paymentsQuery.isError) {
    const state = getRequestState(paymentsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk memverifikasi pembayaran."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Verifikasi pembayaran tidak dapat diakses"
          description="Izin akunmu tidak mencakup verifikasi pembayaran."
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
          description="Daftar pembayaran belum dapat diperbarui."
          onRetry={() => void paymentsQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Daftar pembayaran belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar pembayaran."
        onRetry={() => void paymentsQuery.refetch()}
      />
    );
  }

  if (!paymentsQuery.data) return <AdminQueueSkeleton />;

  const payments = paymentsQuery.data.data.items;

  return (
    <div className="payment-panel">
      <div className="payment-review-toolbar">
        <div className="field payment-review-filter">
          <label htmlFor="payment-status-filter">Status</label>
          <select
            className="input"
            id="payment-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as PaymentStatus | "")}
          >
            {statusFilters.map((option) => (
              <option value={option.value} key={option.value || "all"}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {payments.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Tidak ada pembayaran"
          description="Bukti pembayaran yang dikirim warga akan muncul di daftar ini."
        />
      ) : (
        <div className="payment-list">
          {payments.map((payment) => (
            <PaymentReviewRow payment={payment} canManage={canVerify} key={payment.id} />
          ))}
        </div>
      )}
    </div>
  );
}
