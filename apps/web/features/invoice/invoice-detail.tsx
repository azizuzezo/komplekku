"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AgendaDetailSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { PaymentSubmitForm } from "@/features/payment/payment-submit-form";
import { ApiError, getRequestState } from "@/lib/api/client";

import { getInvoice, invoiceKeys } from "./invoice-api";
import {
  formatInvoiceDate,
  formatRupiah,
  invoiceStatusLabels,
  invoiceStatusTone,
} from "./invoice-list";

function formatInvoiceDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function InvoiceDetail({ id }: { id: string }) {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("invoice.read") ?? false;

  const invoiceQuery = useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoice(id),
    enabled: canRead,
  });

  if (meQuery.isPending || (canRead && invoiceQuery.isPending)) {
    return <AgendaDetailSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat detail tagihan ini."
          headingLevel={1}
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
          headingLevel={1}
          onRetry={() => void meQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Izin akun belum bisa diperiksa"
        description="Terjadi kendala saat mengambil informasi akunmu."
        headingLevel={1}
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canRead) {
    return (
      <StatePanel
        kind="forbidden"
        title="Tagihan tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat tagihan iuran ini."
        headingLevel={1}
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (invoiceQuery.isError) {
    const state = getRequestState(invoiceQuery.error);
    if (invoiceQuery.error instanceof ApiError && invoiceQuery.error.status === 404) {
      return (
        <StatePanel
          kind="empty"
          title="Tagihan tidak ditemukan"
          description="Tagihan mungkin sudah dihapus atau alamatnya tidak tepat."
          headingLevel={1}
          actionHref="/iuran"
          actionLabel="Kembali ke daftar tagihan"
        />
      );
    }
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat tagihan ini."
          headingLevel={1}
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Tagihan tidak dapat diakses"
          description="Akunmu belum memiliki izin untuk melihat tagihan ini."
          headingLevel={1}
          actionHref="/iuran"
          actionLabel="Kembali ke daftar tagihan"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Tagihan ini belum tersedia secara offline."
          headingLevel={1}
          onRetry={() => void invoiceQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Tagihan belum bisa dimuat"
        description="Terjadi kendala saat mengambil detail tagihan."
        headingLevel={1}
        onRetry={() => void invoiceQuery.refetch()}
      />
    );
  }

  if (!invoiceQuery.data) return <AgendaDetailSkeleton />;

  const invoice = invoiceQuery.data.data.invoice;

  return (
    <article className="invoice-detail">
      <Link className="text-link" href="/iuran">
        <ArrowLeft size={16} aria-hidden="true" />
        Semua tagihan
      </Link>
      <header>
        <p className="section-kicker">{invoice.duesTypeName}</p>
        <div className="invoice-detail__title-row">
          <h1>Periode {invoice.period}</h1>
          <span className={`status-label status-label--${invoiceStatusTone(invoice.status)}`}>
            {invoiceStatusLabels[invoice.status]}
          </span>
        </div>
      </header>

      <dl className="invoice-detail__facts">
        <div>
          <dt>Jumlah</dt>
          <dd>{formatRupiah(invoice.amount)}</dd>
        </div>
        <div>
          <dt>Jatuh tempo</dt>
          <dd>{formatInvoiceDate(invoice.dueDate)}</dd>
        </div>
        <div>
          <dt>Rumah</dt>
          <dd>{invoice.houseCode}</dd>
        </div>
      </dl>

      {invoice.status === "WAIVED" && invoice.waivedReason && (
        <div className="invoice-detail__body">
          <h2>Alasan pembebasan</h2>
          <p>{invoice.waivedReason}</p>
        </div>
      )}

      {invoice.status === "PAID" && (
        <div className="invoice-receipt" aria-labelledby="invoice-receipt-heading">
          <h2 id="invoice-receipt-heading">Bukti pembayaran</h2>
          <dl className="invoice-receipt__facts">
            <div>
              <dt>Status</dt>
              <dd>LUNAS</dd>
            </div>
            <div>
              <dt>Periode</dt>
              <dd>{invoice.period}</dd>
            </div>
            <div>
              <dt>Jumlah dibayar</dt>
              <dd>{formatRupiah(invoice.amount)}</dd>
            </div>
            {invoice.paidAt && (
              <div>
                <dt>Dibayar pada</dt>
                <dd>{formatInvoiceDateTime(invoice.paidAt)}</dd>
              </div>
            )}
            {invoice.receiptNumber && (
              <div>
                <dt>Nomor referensi</dt>
                <dd>{invoice.receiptNumber}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") && (
        <div className="invoice-detail__body">
          <h2>Kirim bukti pembayaran</h2>
          <PaymentSubmitForm invoiceId={invoice.id} defaultAmount={invoice.amount} />
        </div>
      )}

      {invoice.status === "PENDING_VERIFICATION" && (
        <p className="field-hint">
          Bukti pembayaran sudah dikirim dan sedang menunggu verifikasi bendahara.
        </p>
      )}
    </article>
  );
}
