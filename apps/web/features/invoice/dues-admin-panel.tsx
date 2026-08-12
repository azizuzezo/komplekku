"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createDuesTypeInputSchema,
  generateInvoicesInputSchema,
  waiveInvoiceInputSchema,
  type CreateDuesTypeInput,
  type DuesType,
  type GenerateInvoicesInput,
  type Invoice,
  type InvoiceStatus,
  type WaiveInvoiceInput,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  createDuesType,
  duesTypeKeys,
  generateInvoices,
  invoiceKeys,
  listDuesTypes,
  listInvoices,
  waiveInvoice,
} from "./invoice-api";
import {
  formatInvoiceDate,
  formatRupiah,
  invoiceStatusLabels,
  invoiceStatusTone,
} from "./invoice-list";

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function blankToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const statusFilters: Array<{ value: InvoiceStatus | ""; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "UNPAID", label: invoiceStatusLabels.UNPAID },
  { value: "PENDING_VERIFICATION", label: invoiceStatusLabels.PENDING_VERIFICATION },
  { value: "PAID", label: invoiceStatusLabels.PAID },
  { value: "OVERDUE", label: invoiceStatusLabels.OVERDUE },
  { value: "WAIVED", label: invoiceStatusLabels.WAIVED },
];

function CreateDuesTypeForm() {
  const queryClient = useQueryClient();
  const form = useForm<CreateDuesTypeInput>({
    resolver: zodResolver(createDuesTypeInputSchema),
    defaultValues: { name: "", description: undefined, defaultAmount: 0 },
  });

  const createMutation = useMutation({
    mutationFn: createDuesType,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: duesTypeKeys.all });
      form.reset({ name: "", description: undefined, defaultAmount: 0 });
    },
  });

  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
      noValidate
    >
      <div className="field">
        <label htmlFor="dues-type-name">Nama jenis iuran</label>
        <input
          className="input"
          id="dues-type-name"
          type="text"
          aria-invalid={Boolean(form.formState.errors.name)}
          aria-describedby={form.formState.errors.name ? "dues-type-name-error" : undefined}
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="field-error" id="dues-type-name-error" role="alert">
            Tulis nama jenis iuran, minimal 2 karakter.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="dues-type-description">Deskripsi (opsional)</label>
        <textarea
          className="input textarea"
          id="dues-type-description"
          rows={3}
          {...form.register("description", { setValueAs: blankToUndefined })}
        />
      </div>

      <div className="field">
        <label htmlFor="dues-type-amount">Nominal standar (Rp)</label>
        <input
          className="input"
          id="dues-type-amount"
          type="number"
          min={1}
          step={1}
          aria-invalid={Boolean(form.formState.errors.defaultAmount)}
          aria-describedby={
            form.formState.errors.defaultAmount ? "dues-type-amount-error" : undefined
          }
          {...form.register("defaultAmount", { valueAsNumber: true })}
        />
        {form.formState.errors.defaultAmount && (
          <p className="field-error" id="dues-type-amount-error" role="alert">
            Nominal harus berupa angka bulat lebih dari 0.
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
          Jenis iuran berhasil dibuat.
        </p>
      )}

      <button className="button button--primary" type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? (
          <>
            <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
            Menyimpan…
          </>
        ) : (
          "Buat jenis iuran"
        )}
      </button>
    </form>
  );
}

function DuesTypeListSection() {
  const duesTypesQuery = useQuery({ queryKey: duesTypeKeys.all, queryFn: listDuesTypes });

  if (duesTypesQuery.isPending) {
    return (
      <p className="loading-notice" aria-live="polite">
        <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
        Memuat jenis iuran…
      </p>
    );
  }

  if (duesTypesQuery.isError) {
    const state = getRequestState(duesTypesQuery.error);
    return (
      <StatePanel
        kind={state === "offline" ? "offline" : "error"}
        title="Jenis iuran belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar jenis iuran."
        onRetry={() => void duesTypesQuery.refetch()}
      />
    );
  }

  const duesTypes = duesTypesQuery.data.data.items;

  if (duesTypes.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada jenis iuran"
        description="Jenis iuran yang kamu buat akan muncul di daftar ini."
      />
    );
  }

  return (
    <ul className="dues-type-list">
      {duesTypes.map((duesType: DuesType) => (
        <li className="dues-type-row" key={duesType.id}>
          <div>
            <h3>{duesType.name}</h3>
            {duesType.description && <p className="dues-type-row__meta">{duesType.description}</p>}
          </div>
          <p className="dues-type-row__amount">{formatRupiah(duesType.defaultAmount)}</p>
        </li>
      ))}
    </ul>
  );
}

function GenerateInvoicesForm() {
  const queryClient = useQueryClient();
  const duesTypesQuery = useQuery({ queryKey: duesTypeKeys.all, queryFn: listDuesTypes });
  const form = useForm<GenerateInvoicesInput>({
    resolver: zodResolver(generateInvoicesInputSchema),
    defaultValues: { duesTypeId: "", period: "", amount: 0, dueDate: "" },
  });

  const generateMutation = useMutation({
    mutationFn: generateInvoices,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });

  if (duesTypesQuery.isPending) {
    return (
      <p className="loading-notice" aria-live="polite">
        <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
        Memuat jenis iuran…
      </p>
    );
  }

  if (duesTypesQuery.isError) {
    const state = getRequestState(duesTypesQuery.error);
    return (
      <StatePanel
        kind={state === "offline" ? "offline" : "error"}
        title="Jenis iuran belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar jenis iuran."
        onRetry={() => void duesTypesQuery.refetch()}
      />
    );
  }

  const duesTypes = duesTypesQuery.data.data.items;
  const { onChange: duesTypeIdOnChange, ...duesTypeIdField } = form.register("duesTypeId");

  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit((values) => generateMutation.mutate(values))}
      noValidate
    >
      <div className="field">
        <label htmlFor="generate-dues-type">Jenis iuran</label>
        <select
          className="input"
          id="generate-dues-type"
          aria-invalid={Boolean(form.formState.errors.duesTypeId)}
          aria-describedby={
            form.formState.errors.duesTypeId ? "generate-dues-type-error" : undefined
          }
          {...duesTypeIdField}
          onChange={(event) => {
            void duesTypeIdOnChange(event);
            const selected = duesTypes.find((duesType) => duesType.id === event.target.value);
            if (selected) form.setValue("amount", selected.defaultAmount);
          }}
        >
          <option value="">Pilih jenis iuran</option>
          {duesTypes.map((duesType) => (
            <option value={duesType.id} key={duesType.id}>
              {duesType.name}
            </option>
          ))}
        </select>
        {form.formState.errors.duesTypeId && (
          <p className="field-error" id="generate-dues-type-error" role="alert">
            Pilih jenis iuran terlebih dahulu.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="generate-period">Periode</label>
        <input
          className="input"
          id="generate-period"
          type="month"
          aria-invalid={Boolean(form.formState.errors.period)}
          aria-describedby={form.formState.errors.period ? "generate-period-error" : undefined}
          {...form.register("period")}
        />
        {form.formState.errors.period && (
          <p className="field-error" id="generate-period-error" role="alert">
            Pilih periode iuran (bulan dan tahun).
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="generate-amount">Nominal (Rp)</label>
        <input
          className="input"
          id="generate-amount"
          type="number"
          min={1}
          step={1}
          aria-invalid={Boolean(form.formState.errors.amount)}
          aria-describedby={form.formState.errors.amount ? "generate-amount-error" : undefined}
          {...form.register("amount", { valueAsNumber: true })}
        />
        {form.formState.errors.amount && (
          <p className="field-error" id="generate-amount-error" role="alert">
            Nominal harus berupa angka bulat lebih dari 0.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="generate-due-date">Jatuh tempo</label>
        <input
          className="input"
          id="generate-due-date"
          type="date"
          aria-invalid={Boolean(form.formState.errors.dueDate)}
          aria-describedby={form.formState.errors.dueDate ? "generate-due-date-error" : undefined}
          {...form.register("dueDate")}
        />
        {form.formState.errors.dueDate && (
          <p className="field-error" id="generate-due-date-error" role="alert">
            Pilih tanggal jatuh tempo.
          </p>
        )}
      </div>

      {generateMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(generateMutation.error)}
        </p>
      )}
      {generateMutation.isSuccess && (
        <p className="form-message form-message--success" role="status">
          Tagihan diterbitkan untuk {generateMutation.data.data.createdCount} rumah tangga.
        </p>
      )}

      <button
        className="button button--primary"
        type="submit"
        disabled={generateMutation.isPending}
      >
        {generateMutation.isPending ? (
          <>
            <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
            Menerbitkan…
          </>
        ) : (
          "Terbitkan tagihan"
        )}
      </button>
    </form>
  );
}

function WaiveInvoiceAction({ invoice }: { invoice: Invoice }) {
  const queryClient = useQueryClient();
  const [isWaiving, setIsWaiving] = useState(false);
  const waiveForm = useForm<WaiveInvoiceInput>({
    resolver: zodResolver(waiveInvoiceInputSchema),
    defaultValues: { reason: "" },
  });

  const waiveMutation = useMutation({
    mutationFn: (input: WaiveInvoiceInput) => waiveInvoice(invoice.id, input),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      waiveForm.reset();
      setIsWaiving(false);
    },
  });

  if (invoice.status === "PAID" || invoice.status === "WAIVED") return null;

  if (!isWaiving) {
    return (
      <button
        className="button button--quiet-danger button--compact"
        type="button"
        onClick={() => setIsWaiving(true)}
      >
        Bebaskan
      </button>
    );
  }

  return (
    <form
      className="invoice-waive-panel"
      onSubmit={waiveForm.handleSubmit((input) => waiveMutation.mutate(input))}
      noValidate
    >
      <div className="field">
        <label htmlFor={`waive-reason-${invoice.id}`}>Alasan pembebasan</label>
        <textarea
          className="input textarea"
          id={`waive-reason-${invoice.id}`}
          rows={2}
          maxLength={500}
          aria-invalid={Boolean(waiveForm.formState.errors.reason)}
          aria-describedby={
            waiveForm.formState.errors.reason ? `waive-reason-error-${invoice.id}` : undefined
          }
          {...waiveForm.register("reason")}
        />
        {waiveForm.formState.errors.reason && (
          <p className="field-error" id={`waive-reason-error-${invoice.id}`} role="alert">
            Tulis alasan pembebasan, minimal 3 karakter.
          </p>
        )}
      </div>
      {waiveMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(waiveMutation.error)}
        </p>
      )}
      <div className="invoice-row__actions">
        <button
          className="button button--danger button--compact"
          type="submit"
          disabled={waiveMutation.isPending}
        >
          {waiveMutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
              Membebaskan…
            </>
          ) : (
            "Konfirmasi pembebasan"
          )}
        </button>
        <button
          className="button button--secondary button--compact"
          type="button"
          onClick={() => {
            waiveMutation.reset();
            waiveForm.reset();
            setIsWaiving(false);
          }}
          disabled={waiveMutation.isPending}
        >
          Batal
        </button>
      </div>
    </form>
  );
}

function CommunityInvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <article className="invoice-admin-row">
      <div className="invoice-admin-row__header">
        <h3>{invoice.duesTypeName}</h3>
        <span className={`status-label status-label--${invoiceStatusTone(invoice.status)}`}>
          {invoiceStatusLabels[invoice.status]}
        </span>
      </div>
      <p className="invoice-row__meta">
        {invoice.houseCode} · {invoice.householdDisplayName}
      </p>
      <p className="invoice-row__meta">
        Periode {invoice.period} · {formatRupiah(invoice.amount)} · Jatuh tempo{" "}
        {formatInvoiceDate(invoice.dueDate)}
      </p>
      <WaiveInvoiceAction invoice={invoice} />
    </article>
  );
}

function CommunityInvoiceListSection() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");

  const invoicesQuery = useQuery({
    queryKey: invoiceKeys.list(statusFilter || undefined),
    queryFn: () => listInvoices(statusFilter || undefined, 100),
  });

  if (invoicesQuery.isPending) return <AdminQueueSkeleton />;

  if (invoicesQuery.isError) {
    const state = getRequestState(invoicesQuery.error);
    return (
      <StatePanel
        kind={state === "offline" ? "offline" : "error"}
        title="Daftar tagihan belum bisa dimuat"
        description="Terjadi kendala saat mengambil tagihan iuran komunitas."
        onRetry={() => void invoicesQuery.refetch()}
      />
    );
  }

  const invoices = invoicesQuery.data.data.items;

  return (
    <div>
      <div className="invoice-toolbar">
        <div className="field invoice-toolbar__filter">
          <label htmlFor="admin-invoice-status-filter">Status</label>
          <select
            className="input"
            id="admin-invoice-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as InvoiceStatus | "")}
          >
            {statusFilters.map((option) => (
              <option value={option.value} key={option.value || "all"}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {invoices.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada tagihan"
          description="Tagihan yang diterbitkan akan muncul di sini."
        />
      ) : (
        <div className="invoice-admin-list">
          {invoices.map((invoice) => (
            <CommunityInvoiceRow invoice={invoice} key={invoice.id} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DuesAdminPanel() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("dues.manage") ?? false;

  if (meQuery.isPending) return <AdminQueueSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk mengelola iuran."
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

  if (!canManage) {
    return (
      <StatePanel
        kind="forbidden"
        title="Pengelolaan iuran tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mengelola jenis iuran dan tagihan."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  return (
    <div className="dues-admin-panel">
      <section aria-labelledby="dues-type-form-heading">
        <div className="section-heading">
          <h2 id="dues-type-form-heading">Buat jenis iuran</h2>
        </div>
        <CreateDuesTypeForm />
      </section>

      <section aria-labelledby="dues-type-list-heading">
        <div className="section-heading">
          <h2 id="dues-type-list-heading">Jenis iuran yang tersedia</h2>
        </div>
        <DuesTypeListSection />
      </section>

      <section aria-labelledby="generate-invoices-heading">
        <div className="section-heading">
          <h2 id="generate-invoices-heading">Terbitkan tagihan</h2>
        </div>
        <GenerateInvoicesForm />
      </section>

      <section aria-labelledby="community-invoice-heading">
        <div className="section-heading">
          <h2 id="community-invoice-heading">Tagihan komunitas</h2>
        </div>
        <CommunityInvoiceListSection />
      </section>
    </div>
  );
}
