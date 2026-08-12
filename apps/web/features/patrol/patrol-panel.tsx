"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  endSession,
  getActiveSession,
  listCheckpoints,
  listPatrolHistory,
  patrolKeys,
  scanCheckpoint,
  startSession,
} from "./patrol-api";

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function PatrolPanel() {
  const queryClient = useQueryClient();
  const [qrToken, setQrToken] = useState("");
  const [note, setNote] = useState("");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canExecute = meQuery.data?.data.permissions.includes("patrol.execute") ?? false;
  const canManage = meQuery.data?.data.permissions.includes("patrol.manage") ?? false;

  const checkpointsQuery = useQuery({
    queryKey: patrolKeys.checkpoints,
    queryFn: listCheckpoints,
    enabled: canExecute,
  });

  const sessionQuery = useQuery({
    queryKey: patrolKeys.session,
    queryFn: getActiveSession,
    enabled: canExecute,
  });

  const historyQuery = useQuery({
    queryKey: patrolKeys.history,
    queryFn: () => listPatrolHistory(20),
    enabled: canManage,
  });

  const startMutation = useMutation({
    mutationFn: startSession,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: patrolKeys.session });
    },
  });

  const scanMutation = useMutation({
    mutationFn: () => scanCheckpoint({ qrToken: qrToken.trim(), note: note.trim() || undefined }),
    onSuccess() {
      setQrToken("");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: patrolKeys.session });
    },
  });

  const endMutation = useMutation({
    mutationFn: endSession,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: patrolKeys.session });
      void queryClient.invalidateQueries({ queryKey: patrolKeys.history });
    },
  });

  if (meQuery.isPending || (canExecute && (checkpointsQuery.isPending || sessionQuery.isPending))) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka halaman patroli."
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

  if (!canExecute) {
    return (
      <StatePanel
        kind="forbidden"
        title="Patroli tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk menjalankan patroli."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (checkpointsQuery.isError) {
    const state = getRequestState(checkpointsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka halaman patroli."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Patroli tidak dapat diakses"
          description="Izin akunmu tidak mencakup patroli."
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
          description="Daftar titik periksa belum dapat diperbarui."
          onRetry={() => void checkpointsQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Titik periksa belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar titik periksa."
        onRetry={() => void checkpointsQuery.refetch()}
      />
    );
  }

  if (!checkpointsQuery.data) return <AdminQueueSkeleton />;

  const checkpoints = [...checkpointsQuery.data.data.items].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const session = sessionQuery.data?.data.session ?? null;
  const sessionMutationError = startMutation.error ?? endMutation.error;
  const history = historyQuery.data?.data.items ?? [];

  return (
    <div className="patrol-panel">
      <section className="patrol-checkpoints" aria-labelledby="patrol-checkpoints-heading">
        <h2 id="patrol-checkpoints-heading">Titik periksa</h2>
        {checkpoints.length === 0 ? (
          <StatePanel
            kind="empty"
            title="Belum ada titik periksa"
            description="Titik periksa yang dikonfigurasi pengurus akan muncul di sini."
          />
        ) : (
          <ol className="patrol-checkpoint-list">
            {checkpoints.map((checkpoint) => (
              <li className="patrol-checkpoint-list__item" key={checkpoint.id}>
                <span className="patrol-checkpoint-list__order">{checkpoint.displayOrder}</span>
                <span>{checkpoint.name}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="patrol-session-card" aria-labelledby="patrol-session-heading">
        <h2 id="patrol-session-heading">Sesi patroli</h2>

        {sessionMutationError && (
          <p className="form-message" role="alert">
            {readableError(sessionMutationError)}
          </p>
        )}

        {sessionQuery.isError ? (
          <p className="form-message" role="alert">
            {readableError(sessionQuery.error)}
          </p>
        ) : session ? (
          <>
            <p className="patrol-session-card__progress">
              Progres: {session.scans.length}/{session.totalCheckpoints} titik periksa
            </p>

            <form
              className="patrol-scan-form"
              onSubmit={(event) => {
                event.preventDefault();
                scanMutation.mutate();
              }}
            >
              <div className="field">
                <label htmlFor="patrol-scan-token">Token titik periksa</label>
                <input
                  className="input"
                  id="patrol-scan-token"
                  type="text"
                  value={qrToken}
                  onChange={(event) => setQrToken(event.target.value)}
                  placeholder="checkpoint-xxxxxxxx"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="patrol-scan-note">Catatan (opsional)</label>
                <input
                  className="input"
                  id="patrol-scan-note"
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                />
              </div>
              {scanMutation.isError && (
                <p className="form-message" role="alert">
                  {readableError(scanMutation.error)}
                </p>
              )}
              <button
                className="button button--primary"
                type="submit"
                disabled={scanMutation.isPending || !qrToken.trim()}
              >
                {scanMutation.isPending ? (
                  <>
                    <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                    Memindai…
                  </>
                ) : (
                  "Pindai titik periksa"
                )}
              </button>
            </form>

            {session.scans.length > 0 && (
              <ul className="patrol-scan-list">
                {session.scans.map((scan) => (
                  <li className="patrol-scan-list__item" key={scan.checkpointId}>
                    <span>{scan.checkpointName}</span>
                    <time dateTime={scan.scannedAt}>{formatDateTime(scan.scannedAt)}</time>
                  </li>
                ))}
              </ul>
            )}

            <button
              className="button button--danger"
              type="button"
              onClick={() => endMutation.mutate()}
              disabled={endMutation.isPending}
            >
              {endMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Mengakhiri…
                </>
              ) : (
                "Akhiri patroli"
              )}
            </button>
          </>
        ) : (
          <button
            className="button button--primary"
            type="button"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                Memulai…
              </>
            ) : (
              "Mulai patroli"
            )}
          </button>
        )}
      </section>

      {canManage && (
        <section className="patrol-history" aria-labelledby="patrol-history-heading">
          <h2 id="patrol-history-heading">Riwayat patroli</h2>
          {historyQuery.isPending ? (
            <AdminQueueSkeleton rows={2} />
          ) : historyQuery.isError ? (
            <StatePanel
              kind="error"
              title="Riwayat belum bisa dimuat"
              description="Terjadi kendala saat mengambil riwayat patroli."
              onRetry={() => void historyQuery.refetch()}
            />
          ) : history.length === 0 ? (
            <StatePanel
              kind="empty"
              title="Belum ada riwayat patroli"
              description="Sesi patroli yang telah selesai akan muncul di sini."
            />
          ) : (
            <ul className="patrol-history-list">
              {history.map((item) => (
                <li className="patrol-history-row" key={item.id}>
                  <div>
                    <p className="patrol-history-row__officer">{item.officerName}</p>
                    <p className="patrol-history-row__time">
                      {formatDateTime(item.startedAt)}
                      {item.endedAt ? ` – ${formatDateTime(item.endedAt)}` : ""}
                    </p>
                  </div>
                  <span className="patrol-history-row__count">
                    {item.scans.length}/{item.totalCheckpoints}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
