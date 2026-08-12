"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createHouseInputSchema, type CreateHouseInput } from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import type { input as ZodInput } from "zod";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import { createHouse, houseKeys, listHouses } from "./house-api";

const occupancyLabels: Record<string, string> = {
  OWNER_OCCUPIED: "Dihuni pemilik",
  RENTED: "Disewakan",
  VACANT: "Kosong",
};

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Rumah belum dapat ditambahkan. Silakan coba lagi.";
}

type HouseFormValues = ZodInput<typeof createHouseInputSchema>;

function emptyHouseValues(): HouseFormValues {
  return { code: "", block: "", number: "", occupancyStatus: "VACANT" };
}

export function HouseAdminPanel() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("resident.manage") ?? false;

  const housesQuery = useQuery({
    queryKey: houseKeys.all,
    queryFn: listHouses,
    enabled: canManage,
  });

  const form = useForm<HouseFormValues, unknown, CreateHouseInput>({
    resolver: zodResolver(createHouseInputSchema),
    defaultValues: emptyHouseValues(),
  });

  const createMutation = useMutation({
    mutationFn: createHouse,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: houseKeys.all });
      form.reset(emptyHouseValues());
    },
  });

  if (meQuery.isPending || (canManage && housesQuery.isPending)) {
    return <AdminQueueSkeleton />;
  }

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk mengelola data rumah."
          headingLevel={1}
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Izin akun belum bisa diperiksa"
        description="Terjadi kendala saat mengambil informasi akunmu."
        headingLevel={1}
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canManage) {
    return (
      <StatePanel
        kind="forbidden"
        title="Data rumah tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mengelola data rumah."
        headingLevel={1}
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  const codeError = form.formState.errors.code
    ? "Masukkan kode rumah, misalnya F2D2-17."
    : undefined;
  const blockError = form.formState.errors.block ? "Masukkan nama blok, misalnya F2D2." : undefined;
  const numberError = form.formState.errors.number
    ? "Masukkan nomor rumah, misalnya 17."
    : undefined;

  return (
    <div className="house-admin-panel">
      <section>
        <h2>Tambah rumah</h2>
        <p className="field-hint">
          Nama blok mendukung format apa pun, tidak hanya satu huruf dan dua digit — misalnya blok
          bertingkat seperti &quot;F2D2 No.17&quot; tetap bisa ditambahkan.
        </p>
        <form
          className="form-stack"
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          noValidate
        >
          <div className="field">
            <label htmlFor="house-code">Kode rumah</label>
            <input
              className="input"
              id="house-code"
              type="text"
              placeholder="F2D2-17"
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? "house-code-error" : "house-code-hint"}
              {...form.register("code")}
            />
            {codeError ? (
              <p className="field-error" id="house-code-error" role="alert">
                {codeError}
              </p>
            ) : (
              <p className="field-hint" id="house-code-hint">
                Kode unik yang dipakai warga saat mengajukan permohonan tempat tinggal.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="house-block">Blok</label>
            <input
              className="input"
              id="house-block"
              type="text"
              placeholder="F2D2"
              aria-invalid={Boolean(blockError)}
              aria-describedby={blockError ? "house-block-error" : undefined}
              {...form.register("block")}
            />
            {blockError && (
              <p className="field-error" id="house-block-error" role="alert">
                {blockError}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="house-number">Nomor rumah</label>
            <input
              className="input"
              id="house-number"
              type="text"
              placeholder="17"
              aria-invalid={Boolean(numberError)}
              aria-describedby={numberError ? "house-number-error" : undefined}
              {...form.register("number")}
            />
            {numberError && (
              <p className="field-error" id="house-number-error" role="alert">
                {numberError}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="house-occupancy">Status hunian</label>
            <select className="input" id="house-occupancy" {...form.register("occupancyStatus")}>
              <option value="VACANT">Kosong</option>
              <option value="OWNER_OCCUPIED">Dihuni pemilik</option>
              <option value="RENTED">Disewakan</option>
            </select>
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
                <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                Menyimpan…
              </>
            ) : (
              "Tambah rumah"
            )}
          </button>
        </form>
      </section>

      <section>
        <h2>Daftar rumah</h2>
        {housesQuery.isError ? (
          <StatePanel
            kind="error"
            title="Daftar rumah belum bisa dimuat"
            description="Terjadi kendala saat mengambil data rumah."
            onRetry={() => void housesQuery.refetch()}
          />
        ) : !housesQuery.data || housesQuery.data.data.items.length === 0 ? (
          <StatePanel
            kind="empty"
            title="Belum ada rumah terdaftar"
            description="Rumah yang ditambahkan akan muncul di daftar ini."
          />
        ) : (
          <ul className="house-list">
            {housesQuery.data.data.items.map((house) => (
              <li className="house-row" key={house.id}>
                <div>
                  <p className="house-row__label">{house.addressLabel}</p>
                  <p className="house-row__meta">
                    Kode {house.code} ·{" "}
                    {occupancyLabels[house.occupancyStatus] ?? house.occupancyStatus}
                    {house.hasHousehold ? " · Sudah ada rumah tangga" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
