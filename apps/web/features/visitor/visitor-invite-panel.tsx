"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createVisitorInputSchema,
  type CreateVisitorInput,
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

import { createVisitor, listVisitors, visitorKeys } from "./visitor-api";

const statusLabels: Record<VisitorStatus, string> = {
  PENDING: "Menunggu kedatangan",
  CHECKED_IN: "Sudah check-in",
  CHECKED_OUT: "Sudah check-out",
  CANCELLED: "Dibatalkan",
};

const emptyInviteValues: CreateVisitorInput = {
  guestName: "",
  visitDate: "",
  expectedTime: "",
  vehicleInfo: "",
  plate: "",
  purpose: "",
  notes: "",
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
    : "Undangan tamu belum dapat dikirim. Silakan coba lagi.";
}

function VisitorInviteRow({ visitor }: { visitor: Visitor }) {
  return (
    <div className="visitor-row">
      <div>
        <p className="visitor-row__name">{visitor.guestName}</p>
        <p className="visitor-row__meta">
          {formatVisitDate(visitor.visitDate)}
          {visitor.isWalkIn ? " · Walk-in" : ""}
        </p>
      </div>
      <span className={`visitor-status visitor-status--${visitor.status.toLowerCase()}`}>
        {statusLabels[visitor.status]}
      </span>
    </div>
  );
}

function VisitorInviteList({ enabled }: { enabled: boolean }) {
  const listQuery = useQuery({
    queryKey: visitorKeys.list(20),
    queryFn: () => listVisitors(20),
    enabled,
  });

  if (!enabled) {
    return (
      <StatePanel
        kind="forbidden"
        title="Daftar undangan tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat daftar undangan tamu."
      />
    );
  }

  if (listQuery.isPending) return <AdminQueueSkeleton rows={2} />;

  if (listQuery.isError) {
    const state = getRequestState(listQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat daftar undangan tamu."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Daftar undangan tidak dapat diakses"
          description="Izin akunmu tidak mencakup daftar undangan tamu."
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar undangan belum dapat diperbarui."
          onRetry={() => void listQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Daftar undangan belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar undangan tamu."
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  if (!listQuery.data) return <AdminQueueSkeleton rows={2} />;

  const visitors = listQuery.data.data.items;

  if (visitors.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada undangan tamu"
        description="Tamu yang kamu undang akan muncul di sini."
      />
    );
  }

  return (
    <div className="visitor-list">
      {visitors.map((visitor) => (
        <VisitorInviteRow visitor={visitor} key={visitor.id} />
      ))}
    </div>
  );
}

export function VisitorInvitePanel() {
  const queryClient = useQueryClient();
  const [lastInvite, setLastInvite] = useState<{ guestName: string; qrToken: string } | null>(null);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canCreate = meQuery.data?.data.permissions.includes("visitor.create") ?? false;
  const canRead = meQuery.data?.data.permissions.includes("visitor.read") ?? false;

  const form = useForm<CreateVisitorInput>({
    resolver: zodResolver(createVisitorInputSchema),
    defaultValues: emptyInviteValues,
  });

  const createMutation = useMutation({
    mutationFn: createVisitor,
    onSuccess(response) {
      setLastInvite({
        guestName: response.data.visitor.guestName,
        qrToken: response.data.visitor.qrToken,
      });
      form.reset(emptyInviteValues);
      void queryClient.invalidateQueries({ queryKey: visitorKeys.all });
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
          description="Masuk kembali untuk mengundang tamu."
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
        description="Terjadi kendala saat mengambil informasi akunmu."
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!canCreate) {
    return (
      <StatePanel
        kind="forbidden"
        title="Undangan tamu tidak dapat dibuat"
        description="Akunmu tidak memiliki izin untuk mengundang tamu."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  const errors = form.formState.errors;

  return (
    <div className="visitor-invite-panel">
      <form
        className="form-stack"
        onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        noValidate
      >
        <div className="field">
          <label htmlFor="guest-name">Nama tamu</label>
          <input
            className="input"
            id="guest-name"
            type="text"
            autoComplete="off"
            aria-invalid={Boolean(errors.guestName)}
            aria-describedby={errors.guestName ? "guest-name-error" : undefined}
            {...form.register("guestName")}
          />
          {errors.guestName && (
            <p className="field-error" id="guest-name-error" role="alert">
              Masukkan nama tamu, minimal 2 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="visit-date">Tanggal kunjungan</label>
          <input
            className="input"
            id="visit-date"
            type="date"
            aria-invalid={Boolean(errors.visitDate)}
            aria-describedby={errors.visitDate ? "visit-date-error" : undefined}
            {...form.register("visitDate")}
          />
          {errors.visitDate && (
            <p className="field-error" id="visit-date-error" role="alert">
              Pilih tanggal kunjungan yang valid.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="expected-time">Perkiraan waktu (opsional)</label>
          <input
            className="input"
            id="expected-time"
            type="time"
            aria-invalid={Boolean(errors.expectedTime)}
            aria-describedby={errors.expectedTime ? "expected-time-error" : undefined}
            {...form.register("expectedTime", { setValueAs: blankToUndefined })}
          />
          {errors.expectedTime && (
            <p className="field-error" id="expected-time-error" role="alert">
              Gunakan format waktu yang valid.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="vehicle-info">Kendaraan (opsional)</label>
          <input
            className="input"
            id="vehicle-info"
            type="text"
            placeholder="Contoh: Mobil sedan hitam"
            aria-invalid={Boolean(errors.vehicleInfo)}
            aria-describedby={errors.vehicleInfo ? "vehicle-info-error" : undefined}
            {...form.register("vehicleInfo", { setValueAs: blankToUndefined })}
          />
          {errors.vehicleInfo && (
            <p className="field-error" id="vehicle-info-error" role="alert">
              Maksimal 160 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="plate">Nomor polisi (opsional)</label>
          <input
            className="input"
            id="plate"
            type="text"
            autoCapitalize="characters"
            aria-invalid={Boolean(errors.plate)}
            aria-describedby={errors.plate ? "plate-error" : undefined}
            {...form.register("plate", { setValueAs: blankToUndefined })}
          />
          {errors.plate && (
            <p className="field-error" id="plate-error" role="alert">
              Maksimal 20 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="purpose">Tujuan (opsional)</label>
          <input
            className="input"
            id="purpose"
            type="text"
            aria-invalid={Boolean(errors.purpose)}
            aria-describedby={errors.purpose ? "purpose-error" : undefined}
            {...form.register("purpose", { setValueAs: blankToUndefined })}
          />
          {errors.purpose && (
            <p className="field-error" id="purpose-error" role="alert">
              Maksimal 200 karakter.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="notes">Catatan (opsional)</label>
          <textarea
            className="input textarea"
            id="notes"
            rows={3}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "notes-error" : undefined}
            {...form.register("notes", { setValueAs: blankToUndefined })}
          />
          {errors.notes && (
            <p className="field-error" id="notes-error" role="alert">
              Maksimal 1000 karakter.
            </p>
          )}
        </div>

        {createMutation.isError && (
          <p className="form-message" role="alert">
            {readableError(createMutation.error)}
          </p>
        )}

        <button
          className="button button--primary button--full"
          type="submit"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Mengirim undangan…
            </>
          ) : (
            "Kirim undangan"
          )}
        </button>
      </form>

      {lastInvite && (
        <div className="visitor-qr-reveal" role="status">
          <p className="visitor-qr-reveal__label">Kode QR untuk {lastInvite.guestName}</p>
          <p className="visitor-qr-reveal__token">{lastInvite.qrToken}</p>
          <p className="visitor-qr-reveal__hint">
            Tunjukkan kode ini ke petugas keamanan saat tamu tiba.
          </p>
        </div>
      )}

      <section className="visitor-invite-list" aria-labelledby="visitor-invite-list-heading">
        <div className="section-heading">
          <h2 id="visitor-invite-list-heading">Undangan tamu kamu</h2>
        </div>
        <VisitorInviteList enabled={canRead} />
      </section>
    </div>
  );
}
