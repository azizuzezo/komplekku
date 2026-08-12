"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import {
  endShift,
  getActiveShift,
  securityShiftKeys,
  startShift,
} from "@/features/security-shift/security-shift-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { getSecurityDashboard, securityDashboardKeys } from "./security-dashboard-api";

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

const SECURITY_MENU_LINKS = [
  { href: "/admin/keamanan/darurat", label: "Darurat" },
  { href: "/admin/keamanan/tamu", label: "Tamu" },
  { href: "/admin/keamanan/paket", label: "Paket" },
  { href: "/admin/keamanan/patroli", label: "Patroli" },
  { href: "/admin/keamanan/kejadian", label: "Kejadian" },
];

export function SecurityDashboardPanel() {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canView = meQuery.data?.data.permissions.includes("security.dashboard.read") ?? false;

  const shiftQuery = useQuery({
    queryKey: securityShiftKeys.active,
    queryFn: getActiveShift,
    enabled: canView,
  });

  const dashboardQuery = useQuery({
    queryKey: securityDashboardKeys.root,
    queryFn: getSecurityDashboard,
    enabled: canView,
  });

  const startShiftMutation = useMutation({
    mutationFn: startShift,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: securityShiftKeys.active });
      void queryClient.invalidateQueries({ queryKey: securityDashboardKeys.root });
    },
  });

  const endShiftMutation = useMutation({
    mutationFn: () => endShift(notes.trim() ? { notes: notes.trim() } : {}),
    onSuccess() {
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: securityShiftKeys.active });
      void queryClient.invalidateQueries({ queryKey: securityDashboardKeys.root });
    },
  });

  if (meQuery.isPending || (canView && (shiftQuery.isPending || dashboardQuery.isPending))) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka dasbor keamanan."
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
        description="Terjadi kendala saat mengambil informasi akun."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canView) {
    return (
      <StatePanel
        kind="forbidden"
        title="Dasbor keamanan tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat dasbor keamanan."
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
          description="Masuk kembali untuk membuka dasbor keamanan."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Dasbor keamanan tidak dapat diakses"
          description="Izin akunmu tidak mencakup dasbor keamanan."
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
        description="Terjadi kendala saat mengambil data dasbor keamanan."
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  if (!dashboardQuery.data) return <AdminQueueSkeleton />;

  const dashboard = dashboardQuery.data.data;
  const activeShift = shiftQuery.data?.data.shift ?? null;
  const shiftMutationError = startShiftMutation.error ?? endShiftMutation.error;
  const isShiftMutating = startShiftMutation.isPending || endShiftMutation.isPending;

  return (
    <div className="security-dashboard">
      <section className="security-shift-card" aria-labelledby="security-shift-heading">
        <div className="security-shift-card__status">
          <p className="section-kicker">Shift jaga</p>
          <h2 id="security-shift-heading">
            {activeShift
              ? `Aktif sejak ${formatDateTime(activeShift.startedAt)}`
              : "Belum ada shift aktif"}
          </h2>
          {activeShift && <p>Petugas: {activeShift.officerName}</p>}
        </div>

        {shiftMutationError && (
          <p className="form-message" role="alert">
            {readableError(shiftMutationError)}
          </p>
        )}

        {shiftQuery.isError ? (
          <p className="form-message" role="alert">
            {readableError(shiftQuery.error)}
          </p>
        ) : activeShift ? (
          <form
            className="security-shift-card__end-form"
            onSubmit={(event) => {
              event.preventDefault();
              endShiftMutation.mutate();
            }}
          >
            <div className="field">
              <label htmlFor="shift-end-notes">Catatan akhir shift (opsional)</label>
              <textarea
                className="input textarea"
                id="shift-end-notes"
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <button className="button button--danger" type="submit" disabled={isShiftMutating}>
              {endShiftMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Mengakhiri…
                </>
              ) : (
                "Akhiri shift"
              )}
            </button>
          </form>
        ) : (
          <button
            className="button button--primary"
            type="button"
            onClick={() => startShiftMutation.mutate()}
            disabled={isShiftMutating}
          >
            {startShiftMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                Memulai…
              </>
            ) : (
              "Mulai shift"
            )}
          </button>
        )}
      </section>

      <div className="security-stat-grid">
        <article className="security-stat-card">
          <p className="security-stat-card__label">Tamu aktif</p>
          <p className="security-stat-card__value">{dashboard.activeVisitorCount}</p>
        </article>
        <article className="security-stat-card">
          <p className="security-stat-card__label">Paket menunggu</p>
          <p className="security-stat-card__value">{dashboard.pendingPackageCount}</p>
        </article>
        <article className="security-stat-card">
          <p className="security-stat-card__label">Kamera daring</p>
          <p className="security-stat-card__value">
            {dashboard.camerasOnline}/{dashboard.camerasTotal}
          </p>
        </article>
        <article className="security-stat-card security-stat-card--danger">
          <p className="security-stat-card__label">Darurat terbuka</p>
          <p className="security-stat-card__value">{dashboard.openEmergencyCount}</p>
        </article>
        <article className="security-stat-card">
          <p className="security-stat-card__label">Progres patroli</p>
          <p className="security-stat-card__value">
            {dashboard.activePatrolSession
              ? `${dashboard.activePatrolSession.completedCheckpoints}/${dashboard.activePatrolSession.totalCheckpoints}`
              : "Tidak berjalan"}
          </p>
        </article>
      </div>

      <nav className="security-menu-grid" aria-label="Alat keamanan">
        {SECURITY_MENU_LINKS.map((link) => (
          <Link className="security-menu-card" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
