"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  rejectResidencyRequestInputSchema,
  type AdminResidencyRequestListResponse,
  type RejectResidencyRequestInput,
} from "@komplekku/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api/client";

import {
  approveResidencyRequest,
  rejectResidencyRequest,
  residencyRequestKeys,
} from "./residency-request-api";
import { formatResidencySubmittedAt, relationshipLabel } from "./residency-request-presenter";

type PendingResidencyRequest = AdminResidencyRequestListResponse["data"]["items"][number];
type ReviewMode = "approve" | "reject" | null;

function readableReviewError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permohonan belum dapat diproses. Silakan coba lagi.";
}

export function ResidencyRequestReview({ request }: { request: PendingResidencyRequest }) {
  const queryClient = useQueryClient();
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const rejectForm = useForm<RejectResidencyRequestInput>({
    resolver: zodResolver(rejectResidencyRequestInputSchema),
    defaultValues: { reason: "" },
  });
  const approveMutation = useMutation({
    mutationFn: () => approveResidencyRequest(request.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: residencyRequestKeys.all });
    },
  });
  const rejectMutation = useMutation({
    mutationFn: (input: RejectResidencyRequestInput) =>
      rejectResidencyRequest({ id: request.id, input }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: residencyRequestKeys.all });
    },
  });
  const isPending = approveMutation.isPending || rejectMutation.isPending;
  const reviewError = approveMutation.error ?? rejectMutation.error;

  return (
    <article className="residency-request-row">
      <header>
        <div>
          <p className="section-kicker">{request.community.name}</p>
          <h2>{request.fullName}</h2>
          <p>{request.user.phoneMasked}</p>
        </div>
        <time dateTime={request.submittedAt}>
          {formatResidencySubmittedAt(request.submittedAt)}
        </time>
      </header>
      <dl className="residency-request-row__facts">
        <div>
          <dt>Rumah</dt>
          <dd>{request.house.addressLabel}</dd>
        </div>
        <div>
          <dt>Kode rumah</dt>
          <dd>{request.house.code}</dd>
        </div>
        <div>
          <dt>Hubungan</dt>
          <dd>{relationshipLabel(request.relationship)}</dd>
        </div>
      </dl>

      {reviewMode === null && (
        <div className="residency-request-row__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => setReviewMode("approve")}
          >
            <Check size={17} aria-hidden="true" />
            Setujui
          </button>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setReviewMode("reject")}
          >
            <X size={17} aria-hidden="true" />
            Tolak
          </button>
        </div>
      )}

      {reviewMode === "approve" && (
        <section className="residency-review-panel" aria-labelledby={`approve-${request.id}`}>
          <div>
            <h3 id={`approve-${request.id}`}>Setujui hubungan warga?</h3>
            <p>
              {request.fullName} akan dihubungkan ke {request.house.addressLabel}.
            </p>
          </div>
          {approveMutation.isError && (
            <p className="form-message" role="alert">
              {readableReviewError(reviewError)}
            </p>
          )}
          <div className="residency-request-row__actions">
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
                "Konfirmasi persetujuan"
              )}
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => {
                approveMutation.reset();
                setReviewMode(null);
              }}
              disabled={isPending}
            >
              Batal
            </button>
          </div>
        </section>
      )}

      {reviewMode === "reject" && (
        <form
          className="residency-review-panel"
          onSubmit={rejectForm.handleSubmit((input) => rejectMutation.mutate(input))}
          noValidate
        >
          <div className="field">
            <label htmlFor={`rejection-reason-${request.id}`}>Alasan penolakan</label>
            <textarea
              className="input textarea"
              id={`rejection-reason-${request.id}`}
              rows={4}
              maxLength={500}
              aria-invalid={Boolean(rejectForm.formState.errors.reason)}
              aria-describedby={
                rejectForm.formState.errors.reason
                  ? `rejection-error-${request.id}`
                  : `rejection-hint-${request.id}`
              }
              {...rejectForm.register("reason")}
            />
            {rejectForm.formState.errors.reason ? (
              <p className="field-error" id={`rejection-error-${request.id}`} role="alert">
                Tulis alasan penolakan, minimal 3 karakter.
              </p>
            ) : (
              <p className="field-hint" id={`rejection-hint-${request.id}`}>
                Alasan membantu pengurus mencatat keputusan secara jelas.
              </p>
            )}
          </div>
          {rejectMutation.isError && (
            <p className="form-message" role="alert">
              {readableReviewError(reviewError)}
            </p>
          )}
          <div className="residency-request-row__actions">
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
