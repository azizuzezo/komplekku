"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  residencyRequestInputSchema,
  type HouseholdRelationship,
  type ResidencyRequestInput,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { OnboardingSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { canStartResidencyRequest, destinationForAuthState } from "@/features/auth/auth-routing";
import { ApiError, getRequestState } from "@/lib/api/client";

import { createResidencyRequest, getOnboardingOptions } from "./onboarding-api";

const relationshipOptions: Array<{ value: HouseholdRelationship; label: string }> = [
  { value: "HEAD", label: "Kepala rumah tangga" },
  { value: "SPOUSE", label: "Suami atau istri" },
  { value: "CHILD", label: "Anak" },
  { value: "PARENT", label: "Orang tua" },
  { value: "RELATIVE", label: "Keluarga" },
  { value: "TENANT", label: "Penyewa" },
  { value: "OTHER", label: "Lainnya" },
];

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permohonan belum dapat dikirim. Silakan coba lagi.";
}

export function ResidencyOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const optionsQuery = useQuery({
    queryKey: ["onboarding", "options"],
    queryFn: getOnboardingOptions,
  });
  const form = useForm<ResidencyRequestInput>({
    resolver: zodResolver(residencyRequestInputSchema),
    defaultValues: {
      communityId: "",
      houseCode: "",
      fullName: "",
      relationship: "HEAD",
    },
  });
  const requestMutation = useMutation({
    mutationFn: createResidencyRequest,
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/menunggu-verifikasi");
      router.refresh();
    },
  });

  const authState = meQuery.data?.data.authState;
  useEffect(() => {
    if (!authState || canStartResidencyRequest(authState)) return;
    router.replace(destinationForAuthState(authState));
  }, [authState, router]);

  if (meQuery.isPending || optionsQuery.isPending) return <OnboardingSkeleton />;

  if (meQuery.isError || optionsQuery.isError) {
    const error = meQuery.error ?? optionsQuery.error;
    const state = getRequestState(error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melanjutkan aktivasi akun warga."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Aktivasi belum dapat dilanjutkan"
          description="Status akunmu belum mengizinkan permohonan tempat tinggal baru."
          actionHref="/status-akun"
          actionLabel="Lihat status akun"
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar lingkungan belum dapat dimuat. Sambungkan kembali perangkatmu lalu coba lagi."
          onRetry={() => {
            void meQuery.refetch();
            void optionsQuery.refetch();
          }}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Aktivasi belum bisa dimuat"
        description="Terjadi kendala saat menyiapkan data aktivasi akunmu."
        onRetry={() => {
          void meQuery.refetch();
          void optionsQuery.refetch();
        }}
      />
    );
  }

  if (!authState || !canStartResidencyRequest(authState)) return <OnboardingSkeleton />;

  const communities = optionsQuery.data.data.communities;
  if (communities.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Pendaftaran belum tersedia"
        description="Belum ada lingkungan yang membuka aktivasi akun warga."
      />
    );
  }

  const selectedCommunity = communities.find((community) => community.id === selectedCommunityId);

  if (step === 1) {
    return (
      <div className="residency-flow">
        <ol className="onboarding-progress" aria-label="Tahapan aktivasi">
          <li className="is-current" aria-current="step">
            <span>01</span>
            Lingkungan
          </li>
          <li>
            <span>02</span>
            Data rumah
          </li>
        </ol>
        <fieldset className="community-selector">
          <legend>Pilih lingkungan tempat tinggal</legend>
          <p>Pilih lingkungan yang akan memeriksa hubunganmu dengan rumah.</p>
          <div className="community-selector__options">
            {communities.map((community) => (
              <label className="community-option" key={community.id}>
                <input
                  type="radio"
                  name="community"
                  value={community.id}
                  checked={selectedCommunityId === community.id}
                  onChange={() => setSelectedCommunityId(community.id)}
                />
                <span>{community.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          className="button button--primary button--full"
          type="button"
          disabled={!selectedCommunity}
          onClick={() => {
            if (!selectedCommunity) return;
            form.setValue("communityId", selectedCommunity.id, { shouldValidate: true });
            setStep(2);
          }}
        >
          Lanjut ke data rumah
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="residency-flow"
      onSubmit={form.handleSubmit((values) => requestMutation.mutate(values))}
      noValidate
    >
      <ol className="onboarding-progress" aria-label="Tahapan aktivasi">
        <li className="is-complete">
          <span>01</span>
          Lingkungan
        </li>
        <li className="is-current" aria-current="step">
          <span>02</span>
          Data rumah
        </li>
      </ol>
      <input type="hidden" {...form.register("communityId")} />
      <div className="selected-community">
        <span>Lingkungan yang dipilih</span>
        <strong>{selectedCommunity?.name}</strong>
      </div>
      <div className="field">
        <label htmlFor="full-name">Nama lengkap</label>
        <input
          className="input"
          id="full-name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(form.formState.errors.fullName)}
          aria-describedby={form.formState.errors.fullName ? "full-name-error" : undefined}
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName && (
          <p className="field-error" id="full-name-error" role="alert">
            Masukkan nama lengkap, minimal 3 karakter.
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="house-code">Kode rumah</label>
        <input
          className="input input--house-code"
          id="house-code"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Contoh: F03"
          maxLength={24}
          aria-invalid={Boolean(form.formState.errors.houseCode)}
          aria-describedby={
            form.formState.errors.houseCode ? "house-code-error" : "house-code-hint"
          }
          {...form.register("houseCode")}
        />
        {form.formState.errors.houseCode ? (
          <p className="field-error" id="house-code-error" role="alert">
            Masukkan kode rumah yang tertera pada alamatmu.
          </p>
        ) : (
          <p className="field-hint" id="house-code-hint">
            Demi privasi warga, daftar rumah tidak ditampilkan.
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="relationship">Hubungan dengan rumah</label>
        <select
          className="input"
          id="relationship"
          aria-invalid={Boolean(form.formState.errors.relationship)}
          {...form.register("relationship")}
        >
          {relationshipOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {requestMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(requestMutation.error)}
        </p>
      )}
      <div className="residency-flow__actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            requestMutation.reset();
            setStep(1);
          }}
          disabled={requestMutation.isPending}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Ganti lingkungan
        </button>
        <button
          className="button button--primary"
          type="submit"
          disabled={requestMutation.isPending}
        >
          {requestMutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Mengirim permohonan…
            </>
          ) : (
            <>
              Kirim untuk diverifikasi
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
