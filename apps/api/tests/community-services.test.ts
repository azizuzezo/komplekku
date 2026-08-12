import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

describe("layanan komunitas (Phase 3)", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("mengalirkan laporan warga dari kirim sampai selesai ditindaklanjuti pengurus", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { cookie: resident.cookie },
      payload: { category: "TRASH", description: "Sampah menumpuk di ujung gang.", location: "Gang F3" },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.report.status).toBe("SUBMITTED");
    expect(created.json().data.report.updates).toHaveLength(1);
    const reportId = created.json().data.report.id as string;

    const ownList = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { cookie: resident.cookie },
    });
    expect(ownList.statusCode).toBe(200);
    expect(ownList.json().data.items.map((item: { id: string }) => item.id)).toContain(reportId);

    repository.setPermissions(demoIds.directoryUser, ["report.read", "report.manage"]);
    const admin = await loginWeb(app, "0812 0000 0002");

    const detail = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${reportId}`,
      headers: { cookie: admin.cookie },
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().data.report.category).toBe("TRASH");

    const updated = await app.inject({
      method: "POST",
      url: `/api/v1/reports/${reportId}/updates`,
      headers: { cookie: admin.cookie },
      payload: { status: "IN_PROGRESS", note: "Tim kebersihan sudah dijadwalkan." },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.report.status).toBe("IN_PROGRESS");
    expect(updated.json().data.report.updates).toHaveLength(2);

    const missing = await app.inject({
      method: "POST",
      url: `/api/v1/reports/${crypto.randomUUID()}/updates`,
      headers: { cookie: admin.cookie },
      payload: { status: "COMPLETED" },
    });
    expect(missing.statusCode).toBe(404);
  });

  it("mengalirkan permohonan surat dari ajuan sampai dokumen siap, dan menolak jenis surat yang tidak dikenal", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const types = await app.inject({
      method: "GET",
      url: "/api/v1/letter-types",
      headers: { cookie: resident.cookie },
    });
    expect(types.statusCode).toBe(200);
    const [firstType] = types.json().data.items as { id: string }[];
    if (!firstType) throw new Error("expected at least one demo letter type");

    const unknownType = await app.inject({
      method: "POST",
      url: "/api/v1/letters",
      headers: { cookie: resident.cookie },
      payload: { letterTypeId: crypto.randomUUID(), purpose: "Keperluan administrasi bank." },
    });
    expect(unknownType.statusCode).toBe(404);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/letters",
      headers: { cookie: resident.cookie },
      payload: { letterTypeId: firstType.id, purpose: "Keperluan administrasi bank." },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.request.status).toBe("SUBMITTED");
    const requestId = created.json().data.request.id as string;

    repository.setPermissions(demoIds.directoryUser, ["letter.read", "letter.manage"]);
    const admin = await loginWeb(app, "0812 0000 0002");

    const approved = await app.inject({
      method: "POST",
      url: `/api/v1/letters/${requestId}/approve`,
      headers: { cookie: admin.cookie },
    });
    expect(approved.statusCode).toBe(200);
    expect(approved.json().data.request.status).toBe("APPROVED");

    const doubleApprove = await app.inject({
      method: "POST",
      url: `/api/v1/letters/${requestId}/approve`,
      headers: { cookie: admin.cookie },
    });
    expect(doubleApprove.statusCode).toBe(409);

    const ready = await app.inject({
      method: "POST",
      url: `/api/v1/letters/${requestId}/ready`,
      headers: { cookie: admin.cookie },
    });
    expect(ready.statusCode).toBe(200);
    expect(ready.json().data.request.status).toBe("READY");
  });

  it("menolak permohonan surat dengan alasan", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const types = await app.inject({
      method: "GET",
      url: "/api/v1/letter-types",
      headers: { cookie: resident.cookie },
    });
    const [firstType] = types.json().data.items as { id: string }[];
    if (!firstType) throw new Error("expected at least one demo letter type");

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/letters",
      headers: { cookie: resident.cookie },
      payload: { letterTypeId: firstType.id, purpose: "Keperluan lainnya." },
    });
    const requestId = created.json().data.request.id as string;

    repository.setPermissions(demoIds.directoryUser, ["letter.read", "letter.manage"]);
    const admin = await loginWeb(app, "0812 0000 0002");

    const rejected = await app.inject({
      method: "POST",
      url: `/api/v1/letters/${requestId}/reject`,
      headers: { cookie: admin.cookie },
      payload: { reason: "Data tidak lengkap." },
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().data.request.status).toBe("REJECTED");
    expect(rejected.json().data.request.rejectionReason).toBe("Data tidak lengkap.");
  });

  it("mencegah pemesanan fasilitas yang bertabrakan dan mengizinkan pembatalan", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);

    const facilities = await app.inject({
      method: "GET",
      url: "/api/v1/facilities",
      headers: { cookie: resident.cookie },
    });
    expect(facilities.statusCode).toBe(200);
    const [facility] = facilities.json().data.items as { id: string }[];
    if (!facility) throw new Error("expected at least one demo facility");

    const booked = await app.inject({
      method: "POST",
      url: "/api/v1/facility-bookings",
      headers: { cookie: resident.cookie },
      payload: {
        facilityId: facility.id,
        bookingDate: "2099-08-10",
        startTime: "10:00",
        endTime: "12:00",
        purpose: "Acara ulang tahun",
      },
    });
    expect(booked.statusCode).toBe(201);
    expect(booked.json().data.booking.status).toBe("CONFIRMED");
    const bookingId = booked.json().data.booking.id as string;

    const overlapping = await app.inject({
      method: "POST",
      url: "/api/v1/facility-bookings",
      headers: { cookie: resident.cookie },
      payload: {
        facilityId: facility.id,
        bookingDate: "2099-08-10",
        startTime: "11:00",
        endTime: "13:00",
      },
    });
    expect(overlapping.statusCode).toBe(409);

    const nonOverlapping = await app.inject({
      method: "POST",
      url: "/api/v1/facility-bookings",
      headers: { cookie: resident.cookie },
      payload: {
        facilityId: facility.id,
        bookingDate: "2099-08-10",
        startTime: "12:00",
        endTime: "13:00",
      },
    });
    expect(nonOverlapping.statusCode).toBe(201);

    const listed = await app.inject({
      method: "GET",
      url: `/api/v1/facility-bookings?date=2099-08-10`,
      headers: { cookie: resident.cookie },
    });
    expect(listed.json().data.items).toHaveLength(2);

    const cancelled = await app.inject({
      method: "POST",
      url: `/api/v1/facility-bookings/${bookingId}/cancel`,
      headers: { cookie: resident.cookie },
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json().data.booking.status).toBe("CANCELLED");

    const nowAvailable = await app.inject({
      method: "POST",
      url: "/api/v1/facility-bookings",
      headers: { cookie: resident.cookie },
      payload: {
        facilityId: facility.id,
        bookingDate: "2099-08-10",
        startTime: "10:00",
        endTime: "12:00",
      },
    });
    expect(nowAvailable.statusCode).toBe(201);

    const invalidRange = await app.inject({
      method: "POST",
      url: "/api/v1/facility-bookings",
      headers: { cookie: resident.cookie },
      payload: {
        facilityId: facility.id,
        bookingDate: "2099-08-11",
        startTime: "12:00",
        endTime: "10:00",
      },
    });
    expect(invalidRange.statusCode).toBe(422);
  });
});
