"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWalkInVisitorInputSchema,
  type CreateWalkInVisitorInput,
  type Visitor,
  type VisitorStatus,
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
  checkInVisitor,
  checkOutVisitor,
  createWalkInVisitor,
  listVisitors,
  lookupVisitorByQrToken,
  visitorKeys,
} from "./visitor-api";

const statusLabels: Record<VisitorStatus, string> = {
  PENDING: "Menunggu kedatangan",
  CHECKED_IN: "Sudah check-in",
  CHECKED_OUT: "Sudah check-out",
  CANCELLED: "Dibatalkan",
};

const emptyWalkInValues: CreateWalkInVisitorInput = {
  houseCode: "",
  guestName: "",
  guestPhone: "",
  vehicleInfo: "",
  plate: "",
  purpose: "",
};

function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function blankToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

function VisitorLookupCard() {
  const queryClient = useQueryClient();
  const [tokenInput, setTokenInput] = useState("");
  const [activeToken, setActiveToken] = useState<string | null>(null);

  const lookupQuery = useQuery({
    queryKey: ["visitor", "lookup", activeToken] as const,
    queryFn: () => lookupVisitorByQrToken(activeToken as string),
    enabled: activeToken !== null,
  });

  const checkInMutation = useMutation({
    mutationFn: () => checkInVisitor(activeToken as string),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: visitorKeys.all });
    },
  });

  const foundVisitor = lookupQuery.data?.data.visitor ?? null;

  return (
    <section className="visitor-lookup-card" aria-labelledby="visitor-lookup-heading">
      <div className="section-heading">
        <h2 id="visitor-lookup-heading">Cari kode QR tamu</h2>
      </div>
      <form
        className="visitor-lookup-form"
        onSubmit={(event) => {
          event.preventDefault();
          checkInMutation.reset();
          setActiveToken(tokenInput.trim());
        }}
      >
        <div className="field">
          <label htmlFor="qr-token">Kode QR</label>
          <input
            className="input"
            id="qr-token"
            type="text"
            autoComplete="off"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
          />
        </div>
        <button
          className="button button--secondary"
          type="submit"
          disabled={tokenInput.trim() === ""}
        >
          Cari
        </button>
      </form>

      {activeToken !== null && lookupQuery.isLoading && (
        <p className="visitor-lookup-status">Mencari kode…</p>
      )}

      {activeToken !== null && lookupQuery.isError && (
        <p className="form-message" role="alert">
          {readableError(lookupQuery.error)}
        </p>
      )}

      {activeToken !== null && lookupQuery.isSuccess && foundVisitor === null && (
        <p className="visitor-lookup-status">Kode tidak ditemukan.</p>
      )}

      {foundVisitor && (
        <div className="visitor-lookup-result">
          <div>
            <p className="visitor-row__name">{foundVisitor.guestName}</p>
            <p className="visitor-row__meta">
              {foundVisitor.houseCode} · {formatVisitDate(foundVisitor.visitDate)}
            </p>
            <span className={`visitor-status visitor-status--${foundVisitor.status.toLowerCase()}`}>
              {statusLabels[foundVisitor.status]}
            </span>
          </div>
          {checkInMutation.isError && (
            <p className="form-message" role="alert">
              {readableError(checkInMutation.error)}
            </p>
          )}
          {foundVisitor.status === "PENDING" && (
            <button
              className="button button--primary"
              type="button"
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
            >
              {checkInMutation.isPending ? (
                <>
                  <LoaderCircle className="loading-icon" size={17} aria-hidden="true" />
                  Memproses…
                </>
              ) : (
                "Check-in"
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function VisitorWalkInForm() {
  const queryClient = useQueryClient();
  const [successGuestName, setSuccessGuestName] = useState<string | null>(null);
  const form = useForm<CreateWalkInVisitorInput>({
    resolver: zodResolver(createWalkInVisitorInputSchema),
    defaultValues: emptyWalkInValues,
  });
  const mutation = useMutation({
    mutationFn: createWalkInVisitor,
    onSuccess(response) {
      setSuccessGuestName(response.data.visitor.guestName);
      form.reset(emptyWalkInValues);
      void queryClient.invalidateQueries({ queryKey: visitorKeys.all });
    },
  });
  const errors = form.formState.errors;

  return (
    <section className="visitor-walkin-form" aria-labelledby="visitor-walkin-heading">
      <div className="section-heading">
        <h2 id="visitor-walkin-heading">Catat tamu walk-in</h2>
      </div>
      <form
        className="form-stack"
        onSubmit={form.handleSubmit((values) => {
          setSuccessGuestName(null);
          mutation.mutate(values);
        })}
        noValidate
      >
        <div className="field">
          <label htmlFor="walkin-house-code">Kode rumah</label>
          <input
            className="input"
            id="walkin-house-code"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Contoh: F03"
            aria-invalid={Boolean(errors.houseCode)}
            aria-describedby={errors.houseCode ? "walkin-house-code-error" : undefined}
            {...form.register("houseCode")}
          />
          {errors.houseCode && (
            <p className="field-error" id="walkin-house-code-error" role="alert">
              Masukkan kode rumah yang dituju.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="walkin-guest-name">Nama tamu</label>
          <input
            className="input"
            id="walkin-guest-name"
            type="text"
            autoComplete="off"
            aria-invalid={Boolean(errors.guestName)}
            aria-describedby={errors.guestName ? "walkin-guest-name-error" : undefined}
            {...form.register("guestName")}
          />
          {errors.guestName && (
            <p className="field-error" id="walkin-guest-name-error" role="alert">
              Masukkan nama tamu, minimal 2 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="walkin-guest-phone">Nomor HP tamu (opsional)</label>
          <input
            className="input"
            id="walkin-guest-phone"
            type="tel"
            inputMode="tel"
            aria-invalid={Boolean(errors.guestPhone)}
            aria-describedby={errors.guestPhone ? "walkin-guest-phone-error" : undefined}
            {...form.register("guestPhone", { setValueAs: blankToUndefined })}
          />
          {errors.guestPhone && (
            <p className="field-error" id="walkin-guest-phone-error" role="alert">
              Masukkan nomor HP yang valid, minimal 6 digit.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="walkin-vehicle-info">Kendaraan (opsional)</label>
          <input
            className="input"
            id="walkin-vehicle-info"
            type="text"
            placeholder="Contoh: Mobil sedan hitam"
            aria-invalid={Boolean(errors.vehicleInfo)}
            aria-describedby={errors.vehicleInfo ? "walkin-vehicle-info-error" : undefined}
            {...form.register("vehicleInfo", { setValueAs: blankToUndefined })}
          />
          {errors.vehicleInfo && (
            <p className="field-error" id="walkin-vehicle-info-error" role="alert">
              Maksimal 160 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="walkin-plate">Nomor polisi (opsional)</label>
          <input
            className="input"
            id="walkin-plate"
            type="text"
            autoCapitalize="characters"
            aria-invalid={Boolean(errors.plate)}
            aria-describedby={errors.plate ? "walkin-plate-error" : undefined}
            {...form.register("plate", { setValueAs: blankToUndefined })}
          />
          {errors.plate && (
            <p className="field-error" id="walkin-plate-error" role="alert">
              Maksimal 20 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="walkin-purpose">Tujuan (opsional)</label>
          <input
            className="input"
            id="walkin-purpose"
            type="text"
            aria-invalid={Boolean(errors.purpose)}
            aria-describedby={errors.purpose ? "walkin-purpose-error" : undefined}
            {...form.register("purpose", { setValueAs: blankToUndefined })}
          />
          {errors.purpose && (
            <p className="field-error" id="walkin-purpose-error" role="alert">
              Maksimal 200 karakter.
            </p>
          )}
        </div>

        {mutation.isError && (
          <p className="form-message" role="alert">
            {readableError(mutation.error)}
          </p>
        )}

        <button
          className="button button--primary button--full"
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Mencatat tamu…
            </>
          ) : (
            "Catat & check-in tamu"
          )}
        </button>
      </form>

      {successGuestName && (
        <p className="visitor-walkin-success" role="status">
          {successGuestName} berhasil dicatat dan sudah check-in.
        </p>
      )}
    </section>
  );
}

function VisitorCheckinRow({ visitor }: { visitor: Visitor }) {
  const queryClient = useQueryClient();
  const checkOutMutation = useMutation({
    mutationFn: () => checkOutVisitor(visitor.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: visitorKeys.all });
    },
  });

  return (
    <div className="visitor-row">
      <div>
        <p className="visitor-row__name">{visitor.guestName}</p>
        <p className="visitor-row__meta">
          {visitor.houseCode} · {formatVisitDate(visitor.visitDate)}
          {visitor.isWalkIn ? " · Walk-in" : ""}
        </p>
        {checkOutMutation.isError && (
          <p className="form-message" role="alert">
            {readableError(checkOutMutation.error)}
          </p>
        )}
      </div>
      <div className="visitor-row__end">
        <span className={`visitor-status visitor-status--${visitor.status.toLowerCase()}`}>
          {statusLabels[visitor.status]}
        </span>
        {visitor.status === "CHECKED_IN" && (
          <button
            className="button button--secondary button--compact"
            type="button"
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
          >
            {checkOutMutation.isPending ? (
              <>
                <LoaderCircle className="loading-icon" size={16} aria-hidden="true" />
                Memproses…
              </>
            ) : (
              "Check-out"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function VisitorCheckinList({ enabled }: { enabled: boolean }) {
  const listQuery = useQuery({
    queryKey: visitorKeys.list(20),
    queryFn: () => listVisitors(20),
    enabled,
  });

  if (!enabled) {
    return (
      <StatePanel
        kind="forbidden"
        title="Daftar tamu tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat daftar tamu."
      />
    );
  }

  if (listQuery.isPending) return <AdminQueueSkeleton rows={3} />;

  if (listQuery.isError) {
    const state = getRequestState(listQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat daftar tamu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Daftar tamu tidak dapat diakses"
          description="Izin akunmu tidak mencakup daftar tamu."
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar tamu belum dapat diperbarui."
          onRetry={() => void listQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Daftar tamu belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar tamu."
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  if (!listQuery.data) return <AdminQueueSkeleton rows={3} />;

  const visitors = listQuery.data.data.items;

  if (visitors.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada tamu"
        description="Tamu yang diundang warga atau dicatat sebagai walk-in akan muncul di sini."
      />
    );
  }

  return (
    <div className="visitor-list">
      {visitors.map((visitor) => (
        <VisitorCheckinRow visitor={visitor} key={visitor.id} />
      ))}
    </div>
  );
}

export function VisitorCheckinPanel() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canCheckin = meQuery.data?.data.permissions.includes("visitor.checkin") ?? false;
  const canRead = meQuery.data?.data.permissions.includes("visitor.read") ?? false;

  if (meQuery.isPending) return <AdminQueueSkeleton />;

  if (meQuery.isError) {
    const state = getRequestState(meQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk membuka pos check-in tamu."
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

  if (!canCheckin) {
    return (
      <StatePanel
        kind="forbidden"
        title="Pos check-in tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk memproses check-in tamu."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  return (
    <div className="visitor-checkin-panel">
      <div className="visitor-checkin-panel__forms">
        <VisitorLookupCard />
        <VisitorWalkInForm />
      </div>

      <section className="visitor-checkin-list" aria-labelledby="visitor-checkin-list-heading">
        <div className="section-heading">
          <h2 id="visitor-checkin-list-heading">Daftar tamu</h2>
        </div>
        <VisitorCheckinList enabled={canRead} />
      </section>
    </div>
  );
}
