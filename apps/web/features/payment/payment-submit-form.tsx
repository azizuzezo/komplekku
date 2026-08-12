"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createPaymentInputSchema, type CreatePaymentInput } from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";

import { getMe } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api/client";

import { createPayment } from "./payment-api";

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Bukti pembayaran belum dapat dikirim. Silakan coba lagi.";
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

type PaymentSubmitFormProps = {
  invoiceId: string;
  defaultAmount?: number;
};

export function PaymentSubmitForm({ invoiceId, defaultAmount }: PaymentSubmitFormProps) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canSubmit = meQuery.data?.data.permissions.includes("payment.create") ?? false;

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentInputSchema),
    defaultValues: {
      invoiceId,
      amount: defaultAmount ?? 0,
      paidAt: todayDateString(),
      note: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(input),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      form.reset({
        invoiceId,
        amount: defaultAmount ?? 0,
        paidAt: todayDateString(),
        note: "",
      });
    },
  });

  if (meQuery.isPending) return null;

  if (!canSubmit) {
    return <p className="field-hint">Akunmu tidak memiliki izin untuk mengirim bukti pembayaran.</p>;
  }

  if (submitMutation.isSuccess) {
    return (
      <p className="form-message form-message--success" role="status">
        Bukti pembayaran terkirim. Menunggu verifikasi bendahara.
      </p>
    );
  }

  const amountError = form.formState.errors.amount
    ? "Masukkan jumlah pembayaran yang valid."
    : undefined;
  const paidAtError = form.formState.errors.paidAt
    ? "Masukkan tanggal transfer yang valid."
    : undefined;
  const noteError = form.formState.errors.note
    ? "Tulis detail transfer, minimal 3 karakter."
    : undefined;

  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit((input) => submitMutation.mutate(input))}
      noValidate
    >
      <input type="hidden" {...form.register("invoiceId")} />

      <div className="field">
        <label htmlFor="payment-amount">Jumlah dibayar</label>
        <input
          className="input"
          id="payment-amount"
          type="number"
          inputMode="numeric"
          min={1}
          aria-invalid={Boolean(amountError)}
          aria-describedby={amountError ? "payment-amount-error" : undefined}
          {...form.register("amount", { valueAsNumber: true })}
        />
        {amountError && (
          <p className="field-error" id="payment-amount-error" role="alert">
            {amountError}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="payment-paid-at">Tanggal transfer</label>
        <input
          className="input"
          id="payment-paid-at"
          type="date"
          aria-invalid={Boolean(paidAtError)}
          aria-describedby={paidAtError ? "payment-paid-at-error" : undefined}
          {...form.register("paidAt")}
        />
        {paidAtError && (
          <p className="field-error" id="payment-paid-at-error" role="alert">
            {paidAtError}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="payment-note">Detail transfer</label>
        <textarea
          className="input textarea"
          id="payment-note"
          rows={3}
          maxLength={300}
          aria-invalid={Boolean(noteError)}
          aria-describedby={noteError ? "payment-note-error" : "payment-note-hint"}
          {...form.register("note")}
        />
        {noteError ? (
          <p className="field-error" id="payment-note-error" role="alert">
            {noteError}
          </p>
        ) : (
          <p className="field-hint" id="payment-note-hint">
            Contoh: Transfer BCA an. Budi, 5 Agustus pukul 10.00, ref 123456. Bendahara akan
            mencocokkan detail ini dengan mutasi rekening, jadi tuliskan bank, nama pengirim,
            waktu transfer, dan nomor referensi selengkap mungkin.
          </p>
        )}
      </div>

      {submitMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(submitMutation.error)}
        </p>
      )}

      <button
        className="button button--primary button--full"
        type="submit"
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? (
          <>
            <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
            Mengirim…
          </>
        ) : (
          "Kirim bukti pembayaran"
        )}
      </button>
    </form>
  );
}
