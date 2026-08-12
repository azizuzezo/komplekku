"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCashTransactionInputSchema,
  type CreateCashTransactionInput,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import type { input as ZodInput } from "zod";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { cashKeys, createCashTransaction } from "./cash-api";
import { CashLedgerSummary } from "./cash-transparency-view";

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type CashTransactionFormValues = ZodInput<typeof createCashTransactionInputSchema>;

function emptyTransactionValues(): CashTransactionFormValues {
  return {
    date: todayDateString(),
    category: "",
    description: "",
    amount: 0,
    type: "INCOME",
    visibility: "PUBLIC_TO_RESIDENTS",
  };
}

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

export function CashLedgerPanel() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("cash.manage") ?? false;

  const form = useForm<CashTransactionFormValues, unknown, CreateCashTransactionInput>({
    resolver: zodResolver(createCashTransactionInputSchema),
    defaultValues: emptyTransactionValues(),
  });

  const createMutation = useMutation({
    mutationFn: createCashTransaction,
    onSuccess() {
      form.reset(emptyTransactionValues());
      void queryClient.invalidateQueries({ queryKey: cashKeys.all });
    },
  });

  if (meQuery.isPending) return <AdminQueueSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka pengelolaan kas."
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

  if (!canManage) {
    return (
      <StatePanel
        kind="forbidden"
        title="Pengelolaan kas tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mencatat transaksi kas."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  const errors = form.formState.errors;

  return (
    <div className="cash-ledger-panel">
      <section className="cash-ledger-form" aria-labelledby="cash-ledger-form-heading">
        <div className="section-heading">
          <h2 id="cash-ledger-form-heading">Catat transaksi</h2>
        </div>
        <form
          className="form-stack"
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          noValidate
        >
          <div className="field">
            <label htmlFor="cash-date">Tanggal</label>
            <input
              className="input"
              id="cash-date"
              type="date"
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "cash-date-error" : undefined}
              {...form.register("date")}
            />
            {errors.date && (
              <p className="field-error" id="cash-date-error" role="alert">
                Pilih tanggal yang valid.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="cash-category">Kategori</label>
            <input
              className="input"
              id="cash-category"
              type="text"
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? "cash-category-error" : undefined}
              {...form.register("category")}
            />
            {errors.category && (
              <p className="field-error" id="cash-category-error" role="alert">
                Kategori minimal 2 karakter.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="cash-description">Keterangan</label>
            <textarea
              className="input textarea"
              id="cash-description"
              rows={3}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "cash-description-error" : undefined}
              {...form.register("description")}
            />
            {errors.description && (
              <p className="field-error" id="cash-description-error" role="alert">
                Keterangan minimal 3 karakter.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="cash-amount">Jumlah (Rp)</label>
            <input
              className="input"
              id="cash-amount"
              type="number"
              min={1}
              step={1}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? "cash-amount-error" : undefined}
              {...form.register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="field-error" id="cash-amount-error" role="alert">
                Masukkan jumlah lebih dari 0.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="cash-type">Jenis</label>
            <select className="input" id="cash-type" {...form.register("type")}>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="cash-visibility">Visibilitas</label>
            <select className="input" id="cash-visibility" {...form.register("visibility")}>
              <option value="PUBLIC_TO_RESIDENTS">Dapat dilihat warga</option>
              <option value="ADMIN_ONLY">Khusus pengurus</option>
            </select>
            <p className="field-hint">
              Transaksi khusus pengurus tidak akan muncul di halaman transparansi kas warga.
            </p>
          </div>

          {createMutation.isError && (
            <p className="form-message" role="alert">
              {readableError(createMutation.error)}
            </p>
          )}

          <button
            className="button button--primary button--full"
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
                Menyimpan…
              </>
            ) : (
              "Catat transaksi"
            )}
          </button>
        </form>
      </section>

      <CashLedgerSummary />
    </div>
  );
}
