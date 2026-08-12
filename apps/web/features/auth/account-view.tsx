"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ClipboardCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AccountSkeleton } from "@/components/ui/content-skeleton";
import { BrandMark } from "@/components/ui/brand-mark";
import { StatePanel } from "@/components/ui/state-panel";
import { ApiError, getRequestState } from "@/lib/api/client";

import { getMe, logout } from "./auth-api";

const residentStatusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  PENDING: "Menunggu verifikasi",
  REJECTED: "Ditolak",
  SUSPENDED: "Ditangguhkan",
  MOVED_OUT: "Sudah pindah",
};

const residentStatusDescriptions: Record<string, string> = {
  PENDING: "Permohonan tempat tinggalmu sedang diperiksa pengurus.",
  REJECTED: "Permohonan tempat tinggal belum dapat disetujui.",
  SUSPENDED: "Akses lingkungan untuk akun ini sedang ditangguhkan.",
  MOVED_OUT: "Akun ini tidak lagi terhubung dengan rumah sebelumnya.",
};

export function AccountView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess() {
      queryClient.clear();
      router.replace("/masuk");
      router.refresh();
    },
  });

  if (meQuery.isPending) return <AccountSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat informasi akunmu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Akses akun dibatasi"
          description="Akunmu belum memiliki izin untuk membuka halaman ini."
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
          description="Informasi akun belum dapat diperbarui. Sambungkan kembali perangkatmu lalu coba lagi."
          onRetry={() => void meQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Akun belum bisa dimuat"
        description="Terjadi kendala saat mengambil informasi akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  const account = meQuery.data.data;
  const context = account.currentContext;
  const displayName = account.displayName ?? "Pengguna Komplekku";
  const residentStatus = account.residentStatus;
  const statusTone =
    residentStatus === "ACTIVE"
      ? "success"
      : residentStatus === "PENDING"
        ? "warning"
        : residentStatus === "REJECTED" || residentStatus === "SUSPENDED"
          ? "danger"
          : "muted";
  const hasResidentCredential = residentStatus === "ACTIVE" && context !== null;

  return (
    <div className="account-stack">
      {hasResidentCredential ? (
        <section className="resident-credential" aria-labelledby="account-name">
          <header className="resident-credential__header">
            <BrandMark variant="mark" href={null} />
            <div>
              <p>Identitas warga</p>
              <span className={`status-label status-label--${statusTone}`}>
                {residentStatusLabels[residentStatus]}
              </span>
            </div>
          </header>
          <div className="resident-credential__identity">
            <p>Nama warga</p>
            <h2 id="account-name">{displayName}</h2>
            <span>{account.phoneMasked}</span>
          </div>
          <dl className="resident-credential__details">
            <div>
              <dt>Lingkungan</dt>
              <dd>{context.community.name}</dd>
            </div>
            <div>
              <dt>Rumah</dt>
              <dd>{context.household.house.addressLabel}</dd>
            </div>
            <div>
              <dt>Rumah tangga</dt>
              <dd>{context.household.displayName}</dd>
            </div>
          </dl>
          <footer className="resident-credential__footer">
            <span>{context.community.name}</span>
            <strong>{context.household.house.code}</strong>
          </footer>
        </section>
      ) : (
        <section className="account-status" aria-labelledby="account-name">
          <header>
            <BrandMark variant="mark" href={null} />
            {residentStatus && (
              <span className={`status-label status-label--${statusTone}`}>
                {residentStatusLabels[residentStatus] ?? residentStatus}
              </span>
            )}
          </header>
          <div>
            <p className="section-kicker">Akun Komplekku</p>
            <h2 id="account-name">{displayName}</h2>
            <p>{account.phoneMasked}</p>
          </div>
          <p className="account-status__description">
            {residentStatus
              ? (residentStatusDescriptions[residentStatus] ??
                "Tempat tinggal belum tersedia untuk akun ini.")
              : "Belum ada tempat tinggal yang terhubung ke akun ini."}
          </p>
        </section>
      )}

      {account.permissions.includes("resident.manage") && (
        <section className="account-admin-access" aria-labelledby="account-admin-heading">
          <ClipboardCheck size={22} aria-hidden="true" />
          <div>
            <h2 id="account-admin-heading">Tugas pengurus</h2>
            <p>Tinjau permohonan tempat tinggal yang menunggu keputusan.</p>
          </div>
          <Link className="text-link" href="/admin/permohonan-warga">
            Buka antrean
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}

      <section className="account-session" aria-labelledby="account-session-heading">
        <div>
          <h2 id="account-session-heading">Sesi akun</h2>
          <p>Keluar jika perangkat ini dipakai bersama orang lain.</p>
        </div>
        {logoutMutation.isError && (
          <p className="form-message" role="alert">
            {logoutMutation.error instanceof ApiError
              ? logoutMutation.error.message
              : "Belum dapat keluar. Silakan coba lagi."}
          </p>
        )}
        <button
          className="button button--quiet-danger account-logout"
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={18} aria-hidden="true" />
          {logoutMutation.isPending ? "Mengakhiri sesi…" : "Keluar dari akun"}
        </button>
      </section>
    </div>
  );
}
