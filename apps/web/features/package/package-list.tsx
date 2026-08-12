"use client";

import type { Package, PackageStatus } from "@komplekku/contracts";
import { useQuery } from "@tanstack/react-query";

import { NotificationListSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { getRequestState } from "@/lib/api/client";

import { listPackages, packageKeys } from "./package-api";

function formatPackageDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function packageStatusLabel(status: PackageStatus) {
  if (status === "COLLECTED") return "Sudah diambil";
  if (status === "NOTIFIED") return "Menunggu diambil";
  return "Baru diterima";
}

function packageStatusTone(status: PackageStatus) {
  if (status === "COLLECTED") return "success";
  if (status === "NOTIFIED") return "warning";
  return "muted";
}

function PackageRow({ item }: { item: Package }) {
  return (
    <article className="package-row">
      <header>
        <div>
          <h2>{item.recipientName}</h2>
          <p>
            {item.courier}
            {item.trackingNumber ? ` · ${item.trackingNumber}` : ""}
          </p>
        </div>
        <span className={`status-label status-label--${packageStatusTone(item.status)}`}>
          {packageStatusLabel(item.status)}
        </span>
      </header>
      <dl className="package-row__facts">
        <div>
          <dt>Diterima</dt>
          <dd>{formatPackageDate(item.receivedAt)}</dd>
        </div>
        {item.status === "COLLECTED" && (
          <>
            <div>
              <dt>Diambil</dt>
              <dd>{item.collectedAt ? formatPackageDate(item.collectedAt) : "-"}</dd>
            </div>
            <div>
              <dt>Diambil oleh</dt>
              <dd>{item.collectedByName ?? "-"}</dd>
            </div>
          </>
        )}
      </dl>
    </article>
  );
}

export function PackageList() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canReadPackages = meQuery.data?.data.permissions.includes("package.read") ?? false;
  const packagesQuery = useQuery({
    queryKey: packageKeys.list(),
    queryFn: () => listPackages(20),
    enabled: canReadPackages,
  });

  if (meQuery.isPending || (canReadPackages && packagesQuery.isPending)) {
    return <NotificationListSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Silakan masuk dulu"
          description="Masuk untuk melihat paket masuk rumahmu."
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

  if (!canReadPackages) {
    return (
      <StatePanel
        kind="forbidden"
        title="Paket belum dapat diakses"
        description="Akunmu belum memiliki izin untuk melihat paket masuk."
        actionHref="/akun"
        actionLabel="Lihat akun"
      />
    );
  }

  if (packagesQuery.isError) {
    const state = getRequestState(packagesQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat paket masuk rumahmu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Paket belum dapat diakses"
          description="Izin akunmu tidak mencakup paket masuk."
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
          description="Daftar paket belum dapat diperbarui."
          onRetry={() => void packagesQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Paket belum bisa dimuat"
        description="Terjadi kendala saat mengambil paket masuk."
        onRetry={() => void packagesQuery.refetch()}
      />
    );
  }

  if (!packagesQuery.data) return <NotificationListSkeleton />;

  const items = packagesQuery.data.data.items;

  if (items.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada paket"
        description="Paket yang diterima satpam untuk rumahmu akan muncul di sini."
      />
    );
  }

  return (
    <div className="package-list">
      {items.map((item) => (
        <PackageRow item={item} key={item.id} />
      ))}
    </div>
  );
}
