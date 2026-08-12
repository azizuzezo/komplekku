"use client";

import type { Camera, CameraAccessLevel, CameraStatus } from "@komplekku/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircle, Video } from "lucide-react";
import { useState } from "react";

import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { cameraKeys, issueStreamTicket, listCameras } from "./camera-api";

const CAMERA_READ_PERMISSIONS = ["camera.public.read", "camera.security.read", "camera.manage"];

const accessLevelLabels: Record<CameraAccessLevel, string> = {
  RESIDENT: "Warga",
  SECURITY: "Keamanan",
  ADMIN_ONLY: "Khusus pengurus",
};

const statusLabels: Record<CameraStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Tiket tontonan belum dapat diambil. Silakan coba lagi.";
}

function CameraRow({ camera }: { camera: Camera }) {
  const [isOpen, setIsOpen] = useState(false);
  const ticketMutation = useMutation({
    mutationFn: () => issueStreamTicket(camera.id),
  });

  return (
    <article className="camera-row">
      <div className="camera-row__header">
        <div>
          <h2>{camera.name}</h2>
          {camera.location && <p>{camera.location}</p>}
        </div>
        <div className="camera-row__badges">
          <span
            className={`camera-status-badge camera-status-badge--${camera.status === "ONLINE" ? "online" : "offline"}`}
          >
            {statusLabels[camera.status]}
          </span>
          <span className="camera-access-badge">{accessLevelLabels[camera.accessLevel]}</span>
        </div>
      </div>

      <div className="camera-row__actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              return;
            }
            setIsOpen(true);
            ticketMutation.mutate();
          }}
        >
          {isOpen ? "Tutup" : "Lihat"}
        </button>
      </div>

      {isOpen && (
        <div className="camera-viewer">
          {ticketMutation.isPending && (
            <p className="camera-viewer__status">
              <LoaderCircle className="loading-icon" size={16} aria-hidden="true" />
              Menyiapkan tontonan simulasi…
            </p>
          )}
          {ticketMutation.isError && (
            <p className="form-message" role="alert">
              {readableError(ticketMutation.error)}
            </p>
          )}
          {ticketMutation.isSuccess && (
            <div className="camera-viewer__mock" role="status">
              <div className="camera-viewer__mock-frame" aria-hidden="true">
                <Video size={28} strokeWidth={1.6} />
              </div>
              <p className="camera-viewer__label">Tayangan simulasi (mode mock)</p>
              <dl className="camera-viewer__facts">
                <div>
                  <dt>Tiket mock</dt>
                  <dd>{ticketMutation.data.data.ticket ?? "Tidak tersedia"}</dd>
                </div>
                <div>
                  <dt>Ditonton oleh</dt>
                  <dd>{ticketMutation.data.data.watermark.viewerName}</dd>
                </div>
                <div>
                  <dt>Label</dt>
                  <dd>{ticketMutation.data.data.watermark.label}</dd>
                </div>
              </dl>
              <p className="camera-viewer__hint">
                Belum ada aliran video sungguhan di lingkungan pengembangan ini — kartu ini hanya
                mensimulasikan tontonan kamera.
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function CameraList() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canViewCameras =
    meQuery.data?.data.permissions.some((permission) =>
      CAMERA_READ_PERMISSIONS.includes(permission),
    ) ?? false;
  const camerasQuery = useQuery({
    queryKey: cameraKeys.list,
    queryFn: listCameras,
    enabled: canViewCameras,
  });

  if (meQuery.isPending || (canViewCameras && camerasQuery.isPending)) {
    return (
      <p className="loading-notice" aria-live="polite">
        <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
        Memuat daftar kamera…
      </p>
    );
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat kamera lingkungan."
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

  if (!canViewCameras) {
    return (
      <StatePanel
        kind="forbidden"
        title="Kamera belum dapat diakses"
        description="Akunmu belum memiliki izin untuk melihat kamera lingkungan."
        actionHref="/akun"
        actionLabel="Lihat akun"
      />
    );
  }

  if (camerasQuery.isError) {
    const state = getRequestState(camerasQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat kamera lingkungan."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Kamera belum dapat diakses"
          description="Izin akunmu tidak mencakup daftar kamera ini."
          actionHref="/akun"
          actionLabel="Lihat akun"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar kamera belum dapat diperbarui."
          onRetry={() => void camerasQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Kamera belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar kamera."
        onRetry={() => void camerasQuery.refetch()}
      />
    );
  }

  if (!camerasQuery.data) return null;

  const cameras = camerasQuery.data.data.items;

  if (cameras.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada kamera"
        description="Kamera yang dapat kamu akses akan muncul di sini."
      />
    );
  }

  return (
    <div className="camera-list">
      {cameras.map((camera) => (
        <CameraRow camera={camera} key={camera.id} />
      ))}
    </div>
  );
}
