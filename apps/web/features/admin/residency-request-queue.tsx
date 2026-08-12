"use client";

import { useQuery } from "@tanstack/react-query";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { getPendingResidencyRequests, residencyRequestKeys } from "./residency-request-api";
import { ResidencyRequestReview } from "./residency-request-review";

export function ResidencyRequestQueue() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManageResidents = meQuery.data?.data.permissions.includes("resident.manage") ?? false;
  const requestsQuery = useQuery({
    queryKey: residencyRequestKeys.pending,
    queryFn: () => getPendingResidencyRequests(100),
    enabled: canManageResidents,
  });

  if (meQuery.isPending || (canManageResidents && requestsQuery.isPending)) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka antrean permohonan warga."
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
        description="Terjadi kendala saat mengambil informasi akun pengurus."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canManageResidents) {
    return (
      <StatePanel
        kind="forbidden"
        title="Antrean pengurus tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk meninjau permohonan warga."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (requestsQuery.isError) {
    const state = getRequestState(requestsQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka antrean permohonan warga."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Antrean pengurus tidak dapat diakses"
          description="Izin akunmu tidak mencakup peninjauan permohonan warga."
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
          description="Antrean permohonan belum dapat diperbarui."
          onRetry={() => void requestsQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Antrean belum bisa dimuat"
        description="Terjadi kendala saat mengambil permohonan warga."
        onRetry={() => void requestsQuery.refetch()}
      />
    );
  }

  if (!requestsQuery.data) return <AdminQueueSkeleton />;

  const requests = requestsQuery.data.data.items;
  const total = requestsQuery.data.meta.total ?? requests.length;

  if (requests.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Tidak ada permohonan menunggu"
        description="Permohonan tempat tinggal baru akan muncul di antrean ini."
      />
    );
  }

  return (
    <div className="residency-request-queue">
      <p className="residency-request-queue__count">
        {total === requests.length
          ? `${total} permohonan menunggu`
          : `Menampilkan ${requests.length} dari ${total} permohonan menunggu`}
      </p>
      <div className="residency-request-list">
        {requests.map((request) => (
          <ResidencyRequestReview request={request} key={request.id} />
        ))}
      </div>
    </div>
  );
}
