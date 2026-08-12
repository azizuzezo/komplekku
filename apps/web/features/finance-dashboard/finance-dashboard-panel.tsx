"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { financeDashboardKeys, getFinanceDashboard } from "./finance-dashboard-api";

function formatRupiah(amount: number) {
  const formatted = `Rp${new Intl.NumberFormat("id-ID").format(Math.abs(amount))}`;
  return amount < 0 ? `-${formatted}` : formatted;
}

const FINANCE_MENU_LINKS = [
  { href: "/admin/keuangan/iuran", label: "Iuran" },
  { href: "/admin/keuangan/pembayaran", label: "Pembayaran" },
  { href: "/admin/keuangan/kas", label: "Kas" },
];

export function FinanceDashboardPanel() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canView = meQuery.data?.data.permissions.includes("finance.dashboard.read") ?? false;

  const dashboardQuery = useQuery({
    queryKey: financeDashboardKeys.root,
    queryFn: getFinanceDashboard,
    enabled: canView,
  });

  if (meQuery.isPending || (canView && dashboardQuery.isPending)) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka dasbor keuangan."
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

  if (!canView) {
    return (
      <StatePanel
        kind="forbidden"
        title="Dasbor keuangan tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat dasbor keuangan."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (dashboardQuery.isError) {
    const state = getRequestState(dashboardQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka dasbor keuangan."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Dasbor keuangan tidak dapat diakses"
          description="Izin akunmu tidak mencakup dasbor keuangan."
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
          description="Data dasbor belum dapat diperbarui."
          onRetry={() => void dashboardQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Dasbor belum bisa dimuat"
        description="Terjadi kendala saat mengambil data dasbor keuangan."
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  if (!dashboardQuery.data) return <AdminQueueSkeleton />;

  const dashboard = dashboardQuery.data.data;

  return (
    <div className="finance-dashboard">
      <div className="finance-stat-grid">
        <article className="finance-stat-card">
          <p className="finance-stat-card__label">Tagihan belum lunas</p>
          <p className="finance-stat-card__value">{dashboard.outstandingInvoiceCount}</p>
          <p className="finance-stat-card__sub">
            {formatRupiah(dashboard.outstandingInvoiceAmount)}
          </p>
        </article>
        <article className="finance-stat-card">
          <p className="finance-stat-card__label">Menunggu verifikasi</p>
          <p className="finance-stat-card__value">{dashboard.pendingVerificationCount}</p>
        </article>
        <article className="finance-stat-card">
          <p className="finance-stat-card__label">Terkumpul bulan ini</p>
          <p className="finance-stat-card__value">{formatRupiah(dashboard.collectedThisMonth)}</p>
        </article>
        <article className="finance-stat-card">
          <p className="finance-stat-card__label">Saldo kas</p>
          <p className="finance-stat-card__value">{formatRupiah(dashboard.cashBalance)}</p>
        </article>
      </div>

      <nav className="finance-menu-grid" aria-label="Alat keuangan">
        {FINANCE_MENU_LINKS.map((link) => (
          <Link className="finance-menu-card" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
