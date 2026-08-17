"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRtInputSchema,
  updateCommunityInputSchema,
  type CreateRtInput,
  type UpdateCommunityInput,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  communityAdminKeys,
  createRt,
  getCurrentCommunity,
  listRts,
  updateCommunity,
  updateRt,
} from "./community-api";

function readableError(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function CommunityIdentityForm() {
  const queryClient = useQueryClient();
  const communityQuery = useQuery({
    queryKey: communityAdminKeys.current,
    queryFn: getCurrentCommunity,
  });
  const community = communityQuery.data?.data.community;

  const form = useForm<UpdateCommunityInput>({
    resolver: zodResolver(updateCommunityInputSchema),
    values: community
      ? {
          name: community.name,
          address: community.address ?? "",
          rwLabel: community.rwLabel ?? "",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: updateCommunity,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: communityAdminKeys.current });
    },
  });

  if (communityQuery.isPending) return <AdminQueueSkeleton />;
  if (communityQuery.isError || !community) {
    return (
      <StatePanel
        kind="error"
        title="Data komunitas belum bisa dimuat"
        description="Terjadi kendala saat mengambil informasi komunitas."
        onRetry={() => void communityQuery.refetch()}
      />
    );
  }

  return (
    <section>
      <h2>Identitas komunitas</h2>
      <p className="field-hint">
        RW saat ini menaungi beberapa RT. Ubah label RW di sini bila strukturnya berubah.
      </p>
      <form
        className="form-stack"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <div className="field">
          <label htmlFor="community-name">Nama komunitas</label>
          <input className="input" id="community-name" type="text" {...form.register("name")} />
        </div>
        <div className="field">
          <label htmlFor="community-address">Alamat</label>
          <input
            className="input"
            id="community-address"
            type="text"
            {...form.register("address")}
          />
        </div>
        <div className="field">
          <label htmlFor="community-rw">Label RW</label>
          <input
            className="input"
            id="community-rw"
            type="text"
            placeholder="RW 13"
            {...form.register("rwLabel")}
          />
        </div>
        {mutation.isError && (
          <p className="form-message" role="alert">
            {readableError(mutation.error, "Perubahan belum dapat disimpan. Silakan coba lagi.")}
          </p>
        )}
        <button className="button button--primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
              Menyimpan…
            </>
          ) : (
            "Simpan identitas"
          )}
        </button>
      </form>
    </section>
  );
}

function RtManagementSection() {
  const queryClient = useQueryClient();
  const rtsQuery = useQuery({ queryKey: communityAdminKeys.rts, queryFn: listRts });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const form = useForm<CreateRtInput>({
    resolver: zodResolver(createRtInputSchema),
    defaultValues: { code: "", name: "" },
  });

  const createMutation = useMutation({
    mutationFn: createRt,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: communityAdminKeys.rts });
      form.reset({ code: "", name: "" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: updateRt,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: communityAdminKeys.rts });
      setEditingId(null);
    },
  });

  if (rtsQuery.isPending) return <AdminQueueSkeleton />;
  if (rtsQuery.isError) {
    return (
      <StatePanel
        kind="error"
        title="Daftar RT belum bisa dimuat"
        description="Terjadi kendala saat mengambil data RT."
        onRetry={() => void rtsQuery.refetch()}
      />
    );
  }

  const rts = rtsQuery.data?.data.items ?? [];

  return (
    <section>
      <h2>RT dalam komunitas</h2>
      <p className="field-hint">
        Warga memilih salah satu RT ini saat mendaftar, dan Ketua RT hanya dapat mengelola RT yang
        ditugaskan padanya.
      </p>
      {rts.length === 0 ? (
        <StatePanel
          kind="empty"
          title="Belum ada RT terdaftar"
          description="RT yang ditambahkan akan muncul di daftar ini."
        />
      ) : (
        <ul className="house-list">
          {rts.map((rt) => (
            <li className="house-row" key={rt.id}>
              {editingId === rt.id ? (
                <form
                  style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    renameMutation.mutate({ rtId: rt.id, changes: { name: editingName } });
                  }}
                >
                  <input
                    className="input"
                    aria-label={`Nama baru untuk ${rt.name}`}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                  />
                  <button
                    className="button button--secondary button--compact"
                    type="submit"
                    disabled={renameMutation.isPending}
                  >
                    Simpan
                  </button>
                  <button
                    className="button button--secondary button--compact"
                    type="button"
                    onClick={() => setEditingId(null)}
                  >
                    Batal
                  </button>
                </form>
              ) : (
                <>
                  <div>
                    <p className="house-row__label">{rt.name}</p>
                    <p className="house-row__meta">Kode {rt.code}</p>
                  </div>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => {
                      setEditingId(rt.id);
                      setEditingName(rt.name);
                    }}
                  >
                    Ubah nama
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="form-stack"
        onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        noValidate
      >
        <div className="field">
          <label htmlFor="rt-code">Kode RT baru</label>
          <input
            className="input"
            id="rt-code"
            type="text"
            placeholder="RT 03"
            {...form.register("code")}
          />
        </div>
        <div className="field">
          <label htmlFor="rt-name">Nama RT baru</label>
          <input
            className="input"
            id="rt-name"
            type="text"
            placeholder="RT 03"
            {...form.register("name")}
          />
        </div>
        {createMutation.isError && (
          <p className="form-message" role="alert">
            {readableError(createMutation.error, "RT belum dapat ditambahkan. Silakan coba lagi.")}
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
            "Tambah RT"
          )}
        </button>
      </form>
    </section>
  );
}

export function CommunityAdminPanel() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canManage = meQuery.data?.data.permissions.includes("community.manage") ?? false;

  if (meQuery.isPending) return <AdminQueueSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk mengelola komunitas."
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
        title="Kelola komunitas tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk mengelola struktur komunitas dan RT."
        headingLevel={1}
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  return (
    <div className="house-admin-panel">
      <CommunityIdentityForm />
      <RtManagementSection />
    </div>
  );
}
