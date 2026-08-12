"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OnboardingSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { destinationForAuthState } from "@/features/auth/auth-routing";
import { getRequestState } from "@/lib/api/client";

import { SessionExitButton } from "./session-exit-button";

export function PendingApprovalView() {
  const router = useRouter();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const authState = meQuery.data?.data.authState;

  useEffect(() => {
    if (!authState || authState === "PENDING_APPROVAL") return;
    router.replace(destinationForAuthState(authState));
  }, [authState, router]);

  if (meQuery.isPending) return <OnboardingSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk memeriksa status permohonanmu."
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
          description="Status terbaru belum dapat diperiksa. Sambungkan kembali perangkatmu lalu coba lagi."
          onRetry={() => void meQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind={state === "forbidden" ? "forbidden" : "error"}
        title="Status belum bisa diperiksa"
        description="Terjadi kendala saat mengambil status akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (authState !== "PENDING_APPROVAL") return <OnboardingSkeleton />;

  const account = meQuery.data.data;

  return (
    <div className="approval-view">
      <section className="approval-summary" aria-labelledby="approval-name">
        <p className="section-kicker">Permohonan tersimpan</p>
        <h2 id="approval-name">{account.displayName ?? "Akun warga"}</h2>
        <p>{account.phoneMasked}</p>
      </section>
      <ol className="approval-timeline" aria-label="Tahapan verifikasi tempat tinggal">
        <li className="is-complete">
          <span aria-hidden="true">01</span>
          <div>
            <strong>Permohonan dikirim</strong>
            <p>Data lingkungan dan rumah sudah diterima.</p>
          </div>
        </li>
        <li className="is-current" aria-current="step">
          <span aria-hidden="true">02</span>
          <div>
            <strong>Pemeriksaan pengurus</strong>
            <p>Pengurus memeriksa kecocokan akun dengan tempat tinggal.</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">03</span>
          <div>
            <strong>Akses lingkungan</strong>
            <p>Beranda terbuka setelah permohonan disetujui.</p>
          </div>
        </li>
      </ol>
      <div className="approval-actions">
        <button
          className="button button--primary"
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
