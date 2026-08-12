"use client";

import type { AuthState } from "@komplekku/contracts";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OnboardingSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { destinationForAuthState } from "@/features/auth/auth-routing";
import { getRequestState } from "@/lib/api/client";

import { SessionExitButton } from "./session-exit-button";

const accountStateCopy: Partial<Record<AuthState, { label: string; title: string; body: string }>> =
  {
    CONTEXT_REQUIRED: {
      label: "Konteks akun",
      title: "Lingkungan aktif belum ditentukan",
      body: "Akunmu memerlukan satu lingkungan aktif sebelum beranda dapat dibuka. Pengurus perlu memastikan konteks akun yang tepat.",
    },
    REJECTED: {
      label: "Hasil verifikasi",
      title: "Permohonan belum disetujui",
      body: "Data tempat tinggalmu belum dapat disetujui. Hubungi pengurus lingkungan untuk meninjau kembali data yang diajukan.",
    },
    SUSPENDED: {
      label: "Akses akun",
      title: "Akses lingkungan ditangguhkan",
      body: "Akun tetap tersimpan, tetapi akses ke data lingkungan sedang dibatasi. Hubungi pengurus untuk pemeriksaan lebih lanjut.",
    },
    ACCOUNT_CONFIGURATION_REQUIRED: {
      label: "Konfigurasi akun",
      title: "Akun perlu diperiksa pengurus",
      body: "Konfigurasi akun belum lengkap untuk membuka lingkungan. Pengurus perlu menyelesaikan pengaturan akunmu.",
    },
  };

export function AccountStatusView() {
  const router = useRouter();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const authState = meQuery.data?.data.authState;
  const statusCopy = authState ? accountStateCopy[authState] : undefined;

  useEffect(() => {
    if (!authState || statusCopy) return;
    router.replace(destinationForAuthState(authState));
  }, [authState, router, statusCopy]);

  if (meQuery.isPending) return <OnboardingSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat status akunmu."
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
          description="Status akun belum dapat diperbarui. Sambungkan kembali perangkatmu lalu coba lagi."
          onRetry={() => void meQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind={state === "forbidden" ? "forbidden" : "error"}
        title="Status akun belum bisa dimuat"
        description="Terjadi kendala saat mengambil informasi akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!statusCopy) return <OnboardingSkeleton />;

  const account = meQuery.data.data;

  return (
    <div className="account-state-view">
      <section className="account-state-notice" aria-labelledby="account-state-title">
        <p className="section-kicker">{statusCopy.label}</p>
        <h2 id="account-state-title">{statusCopy.title}</h2>
        <p>{statusCopy.body}</p>
      </section>
      <dl className="account-state-identity">
        <div>
          <dt>Nama akun</dt>
          <dd>{account.displayName ?? "Belum dilengkapi"}</dd>
        </div>
        <div>
          <dt>Nomor HP</dt>
          <dd>{account.phoneMasked}</dd>
        </div>
      </dl>
      <div className="approval-actions">
        {authState === "REJECTED" && (
          <Link className="button button--primary" href="/mulai/komunitas">
            Ajukan kembali
          </Link>
        )}
        <button
          className={`button ${authState === "REJECTED" ? "button--secondary" : "button--primary"}`}
          type="button"
          onClick={() => void meQuery.refetch()}
          disabled={meQuery.isFetching}
        >
          <RefreshCw
            className={meQuery.isFetching ? "loading-icon" : undefined}
            size={18}
            aria-hidden="true"
          />
          {meQuery.isFetching ? "Memeriksa status…" : "Periksa status"}
        </button>
        <SessionExitButton />
      </div>
    </div>
  );
}
