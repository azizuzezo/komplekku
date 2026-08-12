"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFacilityBookingInputSchema,
  type CreateFacilityBookingInput,
  type Facility,
  type FacilityBooking,
} from "@komplekku/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AdminQueueSkeleton } from "@/components/ui/content-skeleton";
import { StatePanel } from "@/components/ui/state-panel";
import { getMe } from "@/features/auth/auth-api";
import { ApiError, getRequestState } from "@/lib/api/client";

import {
  cancelFacilityBooking,
  createFacilityBooking,
  facilityKeys,
  listFacilities,
  listFacilityBookings,
} from "./facility-api";

const emptyBookingValues: CreateFacilityBookingInput = {
  facilityId: "",
  bookingDate: "",
  startTime: "",
  endTime: "",
  purpose: "",
};

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function formatFacilityHours(facility: Facility) {
  const capacity = facility.capacity !== null ? ` · kapasitas ${facility.capacity} orang` : "";
  return `${facility.openTime}–${facility.closeTime}${capacity}`;
}

function FacilityScheduleRow({ booking }: { booking: FacilityBooking }) {
  return (
    <div className="facility-booking-row">
      <div>
        <p className="facility-booking-row__time">
          {booking.startTime}–{booking.endTime}
        </p>
        <p className="facility-booking-row__meta">
          Sudah dipesan oleh {booking.bookedByName} ({booking.houseCode})
          {booking.purpose ? ` · ${booking.purpose}` : ""}
        </p>
      </div>
    </div>
  );
}

function FacilityCancelRow({
  booking,
  onCancelled,
}: {
  booking: FacilityBooking;
  onCancelled: () => void;
}) {
  const cancelMutation = useMutation({
    mutationFn: () => cancelFacilityBooking(booking.id),
    onSuccess: onCancelled,
  });

  return (
    <div className="facility-booking-row">
      <div>
        <p className="facility-booking-row__time">
          {booking.startTime}–{booking.endTime}
        </p>
        <p className="facility-booking-row__meta">
          {booking.facilityName} · {booking.houseCode}
          {booking.purpose ? ` · ${booking.purpose}` : ""}
        </p>
        {cancelMutation.isError && (
          <p className="form-message" role="alert">
            {readableError(cancelMutation.error)}
          </p>
        )}
      </div>
      <button
        className="button button--quiet-danger button--compact"
        type="button"
        onClick={() => cancelMutation.mutate()}
        disabled={cancelMutation.isPending}
      >
        {cancelMutation.isPending ? (
          <>
            <LoaderCircle className="loading-icon" size={16} aria-hidden="true" />
            Membatalkan…
          </>
        ) : (
          "Batalkan"
        )}
      </button>
    </div>
  );
}

export function FacilityBookingPanel() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const canRead = meQuery.data?.data.permissions.includes("facility.read") ?? false;
  const canBook = meQuery.data?.data.permissions.includes("facility.book") ?? false;
  const canManage = meQuery.data?.data.permissions.includes("facility.manage") ?? false;
  const myDisplayName = meQuery.data?.data.displayName ?? null;

  const facilitiesQuery = useQuery({
    queryKey: facilityKeys.list,
    queryFn: listFacilities,
    enabled: canRead,
  });

  const facilities = facilitiesQuery.data?.data.items ?? [];

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayDateString());

  const activeFacilityId = selectedFacilityId ?? facilities[0]?.id ?? null;
  const activeFacility = facilities.find((facility) => facility.id === activeFacilityId) ?? null;

  const bookingsQuery = useQuery({
    queryKey: facilityKeys.bookings(activeFacilityId ?? undefined, selectedDate),
    queryFn: () =>
      listFacilityBookings({ facilityId: activeFacilityId ?? undefined, date: selectedDate }),
    enabled: canRead && activeFacilityId !== null,
  });

  const form = useForm<CreateFacilityBookingInput>({
    resolver: zodResolver(createFacilityBookingInputSchema),
    defaultValues: {
      ...emptyBookingValues,
      facilityId: activeFacilityId ?? "",
      bookingDate: selectedDate,
    },
  });

  useEffect(() => {
    if (activeFacilityId) form.setValue("facilityId", activeFacilityId);
  }, [activeFacilityId, form]);

  useEffect(() => {
    form.setValue("bookingDate", selectedDate);
  }, [selectedDate, form]);

  function invalidateBookings() {
    void queryClient.invalidateQueries({
      queryKey: facilityKeys.bookings(activeFacilityId ?? undefined, selectedDate),
    });
  }

  const createMutation = useMutation({
    mutationFn: createFacilityBooking,
    onSuccess() {
      form.reset({
        ...emptyBookingValues,
        facilityId: activeFacilityId ?? "",
        bookingDate: selectedDate,
      });
      invalidateBookings();
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
          description="Masuk kembali untuk membuka fasilitas & pemesanan."
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

  if (!canRead) {
    return (
      <StatePanel
        kind="forbidden"
        title="Fasilitas tidak dapat diakses"
        description="Akunmu tidak memiliki izin untuk melihat fasilitas dan jadwal pemesanan."
        actionHref="/"
        actionLabel="Ke beranda"
      />
    );
  }

  if (facilitiesQuery.isPending) return <AdminQueueSkeleton />;

  if (facilitiesQuery.isError) {
    const state = getRequestState(facilitiesQuery.error);
    if (state === "unauthorized") {
      return (
        <StatePanel
          kind="unauthorized"
          title="Sesi sudah berakhir"
          description="Masuk kembali untuk melihat daftar fasilitas."
          actionHref="/masuk"
          actionLabel="Masuk"
        />
      );
    }
    if (state === "forbidden") {
      return (
        <StatePanel
          kind="forbidden"
          title="Daftar fasilitas tidak dapat diakses"
          description="Izin akunmu tidak mencakup daftar fasilitas."
        />
      );
    }
    if (state === "offline") {
      return (
        <StatePanel
          kind="offline"
          title="Kamu sedang offline"
          description="Daftar fasilitas belum dapat diperbarui."
          onRetry={() => void facilitiesQuery.refetch()}
        />
      );
    }
    return (
      <StatePanel
        kind="error"
        title="Daftar fasilitas belum bisa dimuat"
        description="Terjadi kendala saat mengambil daftar fasilitas."
        onRetry={() => void facilitiesQuery.refetch()}
      />
    );
  }

  if (facilities.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title="Belum ada fasilitas"
        description="Fasilitas yang dapat dipesan akan muncul di sini."
      />
    );
  }

  const errors = form.formState.errors;
  const bookings = bookingsQuery.data?.data.items ?? [];
  const cancellableBookings = bookings.filter(
    (booking) => canManage || (myDisplayName !== null && booking.bookedByName === myDisplayName),
  );

  return (
    <div className="facility-booking-panel">
      <section className="facility-picker" aria-labelledby="facility-picker-heading">
        <div className="section-heading">
          <h2 id="facility-picker-heading">Pilih fasilitas & tanggal</h2>
        </div>
        <div className="facility-picker__controls">
          <div className="field">
            <label htmlFor="facility-select">Fasilitas</label>
            <select
              className="input"
              id="facility-select"
              value={activeFacilityId ?? ""}
              onChange={(event) => setSelectedFacilityId(event.target.value)}
            >
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
            {activeFacility && (
              <p className="field-hint">
                Jam operasional {formatFacilityHours(activeFacility)}
                {activeFacility.rules ? ` · ${activeFacility.rules}` : ""}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="booking-date">Tanggal</label>
            <input
              className="input"
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="facility-schedule" aria-labelledby="facility-schedule-heading">
        <div className="section-heading">
          <h2 id="facility-schedule-heading">Jadwal pada tanggal ini</h2>
        </div>

        {bookingsQuery.isPending && <AdminQueueSkeleton rows={2} />}

        {bookingsQuery.isError &&
          (() => {
            const state = getRequestState(bookingsQuery.error);
            if (state === "unauthorized") {
              return (
                <StatePanel
                  kind="unauthorized"
                  title="Sesi sudah berakhir"
                  description="Masuk kembali untuk melihat jadwal pemesanan."
                  actionHref="/masuk"
                  actionLabel="Masuk"
                />
              );
            }
            if (state === "forbidden") {
              return (
                <StatePanel
                  kind="forbidden"
                  title="Jadwal pemesanan tidak dapat diakses"
                  description="Izin akunmu tidak mencakup jadwal pemesanan fasilitas."
                />
              );
            }
            if (state === "offline") {
              return (
                <StatePanel
                  kind="offline"
                  title="Kamu sedang offline"
                  description="Jadwal pemesanan belum dapat diperbarui."
                  onRetry={() => void bookingsQuery.refetch()}
                />
              );
            }
            return (
              <StatePanel
                kind="error"
                title="Jadwal pemesanan belum bisa dimuat"
                description="Terjadi kendala saat mengambil jadwal pemesanan fasilitas."
                onRetry={() => void bookingsQuery.refetch()}
              />
            );
          })()}

        {bookingsQuery.isSuccess &&
          (bookings.length === 0 ? (
            <StatePanel
              kind="empty"
              title="Belum ada pemesanan pada tanggal ini"
              description="Slot yang sudah dipesan untuk fasilitas ini akan muncul di sini."
            />
          ) : (
            <div className="facility-booking-list">
              {bookings.map((booking) => (
                <FacilityScheduleRow booking={booking} key={booking.id} />
              ))}
            </div>
          ))}
      </section>

      {canBook && activeFacility && (
        <section className="facility-booking-form" aria-labelledby="facility-booking-form-heading">
          <div className="section-heading">
            <h2 id="facility-booking-form-heading">Pesan {activeFacility.name}</h2>
          </div>
          <form
            className="form-stack"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
            noValidate
          >
            <input type="hidden" {...form.register("facilityId")} />
            <input type="hidden" {...form.register("bookingDate")} />

            <div className="field">
              <label htmlFor="start-time">Waktu mulai</label>
              <input
                className="input"
                id="start-time"
                type="time"
                aria-invalid={Boolean(errors.startTime)}
                aria-describedby={errors.startTime ? "start-time-error" : undefined}
                {...form.register("startTime")}
              />
              {errors.startTime && (
                <p className="field-error" id="start-time-error" role="alert">
                  Pilih waktu mulai yang valid.
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="end-time">Waktu selesai</label>
              <input
                className="input"
                id="end-time"
                type="time"
                aria-invalid={Boolean(errors.endTime)}
                aria-describedby={errors.endTime ? "end-time-error" : undefined}
                {...form.register("endTime")}
              />
              {errors.endTime && (
                <p className="field-error" id="end-time-error" role="alert">
                  {errors.endTime.message ?? "Pilih waktu selesai yang valid."}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="purpose">Keperluan (opsional)</label>
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
                  Memesan…
                </>
              ) : (
                "Pesan fasilitas"
              )}
            </button>
          </form>
        </section>
      )}

      <section className="facility-my-bookings" aria-labelledby="facility-my-bookings-heading">
        <div className="section-heading">
          <h2 id="facility-my-bookings-heading">Pemesanan saya</h2>
        </div>

        {bookingsQuery.isPending && <AdminQueueSkeleton rows={2} />}

        {bookingsQuery.isSuccess &&
          (cancellableBookings.length === 0 ? (
            <StatePanel
              kind="empty"
              title="Belum ada pemesanan yang dapat dibatalkan"
              description="Pemesananmu pada fasilitas dan tanggal ini akan muncul di sini."
            />
          ) : (
            <div className="facility-booking-list">
              {cancellableBookings.map((booking) => (
                <FacilityCancelRow
                  booking={booking}
                  key={booking.id}
                  onCancelled={invalidateBookings}
                />
              ))}
            </div>
          ))}
      </section>
    </div>
  );
}
