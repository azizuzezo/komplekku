"use client";

import type { Emergency, EmergencyKind, EmergencyStatus } from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  acknowledgeEmergency,
  emergencyKeys,
  listEmergencies,
  respondToEmergency,
  resolveEmergency,
} from "./emergency-api";

const kindLabels: Record<EmergencyKind, string> = {
  SECURITY: "Keamanan",
  MEDICAL: "Medis",
  FIRE: "Kebakaran",
  ENVIRONMENTAL: "Lingkungan",
  OTHER: "Lainnya",
};

const statusLabels: Record<EmergencyStatus, string> = {
  SENT: "Terkirim",
  ACKNOWLEDGED: "Diterima petugas",
  RESPONDING: "Petugas menuju lokasi",
  RESOLVED: "Selesai ditangani",
};

const statusClassNames: Record<EmergencyStatus, string> = {
  SENT: "emergency-status--sent",
  ACKNOWLEDGED: "emergency-status--acknowledged",
  RESPONDING: "emergency-status--responding",
  RESOLVED: "emergency-status--resolved",
};

function formatSentAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function readableActionError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Tindakan belum dapat diproses. Silakan coba lagi.";
}

function EmergencyTriageRow({
  emergency,
  canManage,
}: {
  emergency: Emergency;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: () => acknowledgeEmergency(emergency.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });
  const respondMutation = useMutation({
    mutationFn: () => respondToEmergency(emergency.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });
  const resolveMutation = useMutation({
    mutationFn: () => resolveEmergency(emergency.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });

  const activeError = acknowledgeMutation.error ?? respondMutation.error ?? resolveMutation.error;
  const isPending =
    acknowledgeMutation.isPending || respondMutation.isPending || resolveMutation.isPending;

  return (
    <article className="emergency-triage-row">
      <header>
        <div>
          <p className="section-kicker">{kindLabels[emergency.kind]}</p>
          <h2>{emergency.houseLabel}</h2>
          <p>{emergency.senderName}</p>
        </div>
        <span className={`emergency-status ${statusClassNames[emergency.status]}`}>
          {statusLabels[emergency.status]}
        </span>
      </header>

      <dl className="emergency-triage-row__facts">
        <div>
          <dt>Terkirim</dt>
          <dd>{formatSentAt(emergency.sentAt)}</dd>
        </div>
        {emergency.note && (
          <div>
            <dt>Catatan</dt>
            <dd>{emergency.note}</dd>
          </div>
        )}
      </dl>

      {canManage && activeError && (
        <p className="form-message" role="alert">
          {readableActionError(activeError)}
        </p>
      )}

      {canManage && (
        <div className="emergency-triage-row__actions">
          {emergency.status === "SENT" && (
            <button
              className="button button--primary"
              type="button"
              onClick={() => acknowledgeMutation.mutate()}
              disabled={isPending}
            >
              {acknowledgeMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Menerima…
                </>
              ) : (
                "Terima"
              )}
            </button>
          )}
          {emergency.status === "ACKNOWLEDGED" && (
            <button
              className="button button--primary"
              type="button"
              onClick={() => respondMutation.mutate()}
              disabled={isPending}
            >
              {respondMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Menuju lokasi…
                </>
              ) : (
                "Tanggapi"
              )}
            </button>
          )}
          {emergency.status === "RESPONDING" && (
            <button
              className="button button--secondary"
              type="button"
              onClick={() => resolveMutation.mutate()}
              disabled={isPending}
            >
              {resolveMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Menyelesaikan…
                </>
              ) : (
                "Selesaikan"
              )}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export function EmergencyTriageList() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canReadEmergencies = meQuery.data?.data.permissions.includes("emergency.read") ?? false;
  const canManageEmergencies = meQuery.data?.data.permissions.includes("emergency.manage") ?? false;

  const listQuery = useQuery({
    queryKey: emergencyKeys.list(20),
    queryFn: () => listEmergencies(20),
    enabled: canReadEmergencies,
    refetchInterval: 15000,
  });

  if (meQuery.isPending || (canReadEmergencies && listQuery.isPending)) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka triase sinyal darurat."
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
        description="Terjadi kendala saat mengambil informasi akun petugas."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canReadEmergencies) {
    return (
      <StatePanel
        kind="forbidden"
        title="Triase darurat tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat sinyal darurat."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (listQuery.isError) {
    const state = getRequestState(listQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka triase sinyal darurat."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Triase darurat tidak dapat diakses"
          description="Izin akunmu tidak mencakup daftar sinyal darurat."
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
          description="Daftar sinyal darurat belum dapat diperbarui."
          onRetry={() => void listQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Sinyal darurat belum bisa dimuat"
        description="Terjadi kendala saat mengambil sinyal darurat."
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  if (!listQuery.data) return <AdminQueueSkeleton />;

  const emergencies = listQuery.data.data.items;

  if (emergencies.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada sinyal darurat"
        description="Sinyal darurat yang dikirim warga akan muncul di sini."
      />
    );
  }

  return (
    <div className="emergency-triage-list">
      {emergencies.map((emergency) => (
        <EmergencyTriageRow
          emergency={emergency}
          canManage={canManageEmergencies}
          key={emergency.id}
        />
      ))}
    </div>
  );
}
