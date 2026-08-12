"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  collectPackageInputSchema,
  createPackageInputSchema,
  type CollectPackageInput,
  type CreatePackageInput,
  type Package,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, PackageCheck, PackagePlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { collectPackage, createPackage, packageKeys } from "./package-api";

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function formatPackageTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function RecentPackageItem({
  item,
  onCollected,
}: {
  item: Package;
  onCollected: (updated: Package) => void;
}) {
  const collectForm = useForm<CollectPackageInput>({
    resolver: zodResolver(collectPackageInputSchema),
    defaultValues: { collectedByName: "" },
  });
  const collectMutation = useMutation({
    mutationFn: (input: CollectPackageInput) => collectPackage(item.id, input),
    onSuccess(response) {
      onCollected(response.data.package);
    },
  });

  return (
    <li className="package-recent-item">
      <div className="package-recent-item__copy">
        <p className="package-recent-item__title">{item.recipientName}</p>
        <p>
          {item.courier}
          {item.trackingNumber ? ` · ${item.trackingNumber}` : ""} · {item.houseCode}
        </p>
        <p>Diterima {formatPackageTime(item.receivedAt)}</p>
      </div>

      {item.status === "COLLECTED" ? (
        <span className="status-label status-label--success">
          Diambil oleh {item.collectedByName ?? "-"}
        </span>
      ) : (
        <form
          className="package-collect-form"
          onSubmit={collectForm.handleSubmit((values) => collectMutation.mutate(values))}
          noValidate
        >
          <div className="field">
            <label htmlFor={`collected-by-${item.id}`}>Nama pengambil</label>
            <input
              className="input"
              id={`collected-by-${item.id}`}
              type="text"
              autoComplete="off"
              aria-invalid={Boolean(collectForm.formState.errors.collectedByName)}
              {...collectForm.register("collectedByName")}
            />
          </div>
          {collectForm.formState.errors.collectedByName && (
            <p className="field-error" role="alert">
              Masukkan nama pengambil, minimal 2 karakter.
            </p>
          )}
          {collectMutation.isError && (
            <p className="form-message" role="alert">
              {readableError(collectMutation.error)}
            </p>
          )}
          <button
            className="button button--secondary button--compact"
            type="submit"
            disabled={collectMutation.isPending}
          >
            {collectMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={16} aria-hidden="true" />
                Menyimpan…
              </>
            ) : (
              <>
                <PackageCheck size={16} aria-hidden="true" />
                Tandai diambil
              </>
            )}
          </button>
        </form>
      )}
    </li>
  );
}

export function PackageManagePanel() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManagePackages = meQuery.data?.data.permissions.includes("package.manage") ?? false;
  const [recentPackages, setRecentPackages] = useState<Package[]>([]);

  const createForm = useForm<CreatePackageInput>({
    resolver: zodResolver(createPackageInputSchema),
    defaultValues: { houseCode: "", recipientName: "", courier: "", trackingNumber: "" },
  });

  const createMutation = useMutation({
    mutationFn: createPackage,
    onSuccess(response) {
      setRecentPackages((current) => [response.data.package, ...current]);
      void queryClient.invalidateQueries({ queryKey: packageKeys.all });
      createForm.reset({ houseCode: "", recipientName: "", courier: "", trackingNumber: "" });
    },
  });

  if (meQuery.isPending) return <AdminQueueSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk mengelola paket & pengiriman."
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

  if (!canManagePackages) {
    return (
      <StatePanel
        kind="forbidden"
        title="Kelola paket tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mencatat paket & pengiriman."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  return (
    <div className="package-manage-panel">
      <form
        className="form-stack package-manage-form"
        onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}
        noValidate
      >
        <h2 className="package-manage-form__heading">Catat paket baru</h2>

        <div className="field">
          <label htmlFor="package-house-code">Kode rumah</label>
          <input
            className="input"
            id="package-house-code"
            type="text"
            autoComplete="off"
            aria-invalid={Boolean(createForm.formState.errors.houseCode)}
            aria-describedby={
              createForm.formState.errors.houseCode ? "package-house-code-error" : undefined
            }
            {...createForm.register("houseCode")}
          />
          {createForm.formState.errors.houseCode && (
            <p className="field-error" id="package-house-code-error" role="alert">
              Masukkan kode rumah yang valid.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="package-recipient-name">Nama penerima</label>
          <input
            className="input"
            id="package-recipient-name"
            type="text"
            autoComplete="off"
            aria-invalid={Boolean(createForm.formState.errors.recipientName)}
            aria-describedby={
              createForm.formState.errors.recipientName ? "package-recipient-name-error" : undefined
            }
            {...createForm.register("recipientName")}
          />
          {createForm.formState.errors.recipientName && (
            <p className="field-error" id="package-recipient-name-error" role="alert">
              Masukkan nama penerima, minimal 2 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="package-courier">Kurir</label>
          <input
            className="input"
            id="package-courier"
            type="text"
            autoComplete="off"
            aria-invalid={Boolean(createForm.formState.errors.courier)}
            aria-describedby={createForm.formState.errors.courier ? "package-courier-error" : undefined}
            {...createForm.register("courier")}
          />
          {createForm.formState.errors.courier && (
            <p className="field-error" id="package-courier-error" role="alert">
              Masukkan nama kurir.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="package-tracking-number">Nomor resi (opsional)</label>
          <input
            className="input"
            id="package-tracking-number"
            type="text"
            autoComplete="off"
            {...createForm.register("trackingNumber")}
          />
          <p className="field-hint">Kosongkan jika paket tidak memiliki nomor resi.</p>
        </div>

        {createMutation.isError && (
          <p className="form-message" role="alert">
            {readableError(createMutation.error)}
          </p>
        )}

        <button
          className="button button--primary"
          type="submit"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Menyimpan…
            </>
          ) : (
            <>
              <PackagePlus size={18} aria-hidden="true" />
              Catat paket
            </>
          )}
        </button>
      </form>

      <section className="package-recent" aria-labelledby="package-recent-heading">
        <h2 className="package-manage-form__heading" id="package-recent-heading">
          Baru saja dicatat
        </h2>
        {recentPackages.length === 0 ? (
          <StatePanel
            kind="empty"
            title="Belum ada paket dicatat"
            description="Paket yang baru dicatat pada sesi ini akan muncul di sini untuk ditandai diambil."
          />
        ) : (
          <ul className="package-recent-list">
            {recentPackages.map((item) => (
              <RecentPackageItem
                item={item}
                onCollected={(updated) => {
                  setRecentPackages((current) =>
                    current.map((pkg) => (pkg.id === updated.id ? updated : pkg)),
                  );
                }}
                key={item.id}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
