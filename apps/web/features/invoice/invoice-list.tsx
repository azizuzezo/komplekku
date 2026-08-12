"use client";

import type { Invoice, InvoiceStatus } from "@komplekku/contracts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";

import { AnnouncementListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { invoiceKeys, listInvoices } from "./invoice-api";

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  UNPAID: "Belum Dibayar",
  PENDING_VERIFICATION: "Menunggu Verifikasi",
  PAID: "Lunas",
  OVERDUE: "Terlambat",
  WAIVED: "Dibebaskan",
};

export function invoiceStatusTone(status: InvoiceStatus) {
  if (status === "PAID") return "success";
  if (status === "PENDING_VERIFICATION") return "warning";
  if (status === "OVERDUE") return "danger";
  if (status === "WAIVED") return "muted";
  return "muted";
}

export function formatRupiah(amount: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
}

export function formatInvoiceDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

const statusFilters: Array<{ value: InvoiceStatus | ""; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "UNPAID", label: invoiceStatusLabels.UNPAID },
  { value: "PENDING_VERIFICATION", label: invoiceStatusLabels.PENDING_VERIFICATION },
  { value: "PAID", label: invoiceStatusLabels.PAID },
  { value: "OVERDUE", label: invoiceStatusLabels.OVERDUE },
  { value: "WAIVED", label: invoiceStatusLabels.WAIVED },
];

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <Link className="invoice-row" href={`/iuran/${invoice.id}`}>
      <div className="invoice-row__header">
        <h2>{invoice.duesTypeName}</h2>
        <span className={`status-label status-label--${invoiceStatusTone(invoice.status)}`}>
          {invoiceStatusLabels[invoice.status]}
        </span>
      </div>
      <p className="invoice-row__meta">
        Periode {invoice.period} · {formatRupiah(invoice.amount)}
      </p>
      <p className="invoice-row__meta">Jatuh tempo {formatInvoiceDate(invoice.dueDate)}</p>
    </Link>
  );
}

export function InvoiceList() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("invoice.read") ?? false;

  const invoicesQuery = useQuery({
    queryKey: invoiceKeys.list(statusFilter || undefined),
    queryFn: () => listInvoices(statusFilter || undefined, 50),
    enabled: canRead,
  });

  if (meQuery.isPending || (canRead && invoicesQuery.isPending)) {
    return <AnnouncementListSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat tagihan iuranmu."
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
        title="Tagihan iuran tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat tagihan iuran."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (invoicesQuery.isError) {
    const state = getRequestState(invoicesQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka tagihan iuranmu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Tagihan iuran tidak dapat diakses"
          description="Izin akunmu tidak mencakup daftar tagihan iuran."
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
          description="Daftar tagihan belum dapat diperbarui."
          onRetry={() => void invoicesQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Tagihan belum bisa dimuat"
        description="Terjadi kendala saat mengambil tagihan iuranmu."
        onRetry={() => void invoicesQuery.refetch()}
      />
    );
  }

  if (!invoicesQuery.data) return <AnnouncementListSkeleton />;

  const invoices = invoicesQuery.data.data.items;

  return (
    <div className="invoice-panel">
      <div className="invoice-toolbar">
        <div className="field invoice-toolbar__filter">
          <label htmlFor="invoice-status-filter">Status</label>
          <select
            className="input"
            id="invoice-status-filter"
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
          title="Belum ada tagihan iuran"
          description="Tagihan iuran yang diterbitkan pengurus akan muncul di sini."
        />
      ) : (
        <div className="invoice-list">
          {invoices.map((invoice) => (
            <InvoiceRow invoice={invoice} key={invoice.id} />
          ))}
        </div>
      )}
    </div>
  );
}
