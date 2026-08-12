import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

const securityPhone = "0812 0000 0003";

describe("operasi keamanan lingkungan (Phase 2)", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("mengalirkan emergency dari warga sampai selesai ditindaklanjuti security", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    const security = await loginWeb(app, securityPhone);

    const forbidden = await app.inject({
      method: "GET",
      url: "/api/v1/incidents",
      headers: { cookie: resident.cookie },
    });
    expect(forbidden.statusCode).toBe(403);

    const sent = await app.inject({
      method: "POST",
      url: "/api/v1/emergencies",
      headers: { cookie: resident.cookie },
      payload: { kind: "MEDICAL", note: "Butuh bantuan segera" },
    });
    expect(sent.statusCode).toBe(201);
    expect(sent.json().data.emergency.status).toBe("SENT");
    expect(sent.json().data.emergency.houseLabel).toBe("Blok F No. 01");
    const emergencyId = sent.json().data.emergency.id as string;

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/emergencies",
      headers: { cookie: security.cookie },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().data.items.map((item: { id: string }) => item.id)).toContain(emergencyId);

    const acknowledged = await app.inject({
      method: "POST",
      url: `/api/v1/emergencies/${emergencyId}/acknowledge`,
      headers: { cookie: security.cookie },
    });
    expect(acknowledged.json().data.emergency.status).toBe("ACKNOWLEDGED");

    const doubleAcknowledge = await app.inject({
      method: "POST",
      url: `/api/v1/emergencies/${emergencyId}/acknowledge`,
      headers: { cookie: security.cookie },
    });
    expect(doubleAcknowledge.statusCode).toBe(409);

    const resolved = await app.inject({
      method: "POST",
      url: `/api/v1/emergencies/${emergencyId}/resolve`,
      headers: { cookie: security.cookie },
    });
    expect(resolved.json().data.emergency.status).toBe("RESOLVED");
  });

  it("mengalirkan tamu dari undangan warga sampai check-in/check-out security", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    const security = await loginWeb(app, securityPhone);

    const invited = await app.inject({
      method: "POST",
      url: "/api/v1/visitors",
      headers: { cookie: resident.cookie },
      payload: { guestName: "Rudi Hartono", visitDate: "2099-08-10" },
    });
    expect(invited.statusCode).toBe(201);
    const qrToken = invited.json().data.visitor.qrToken as string;
    expect(qrToken).toBeTruthy();

    const lookup = await app.inject({
      method: "GET",
      url: `/api/v1/visitors/lookup/${qrToken}`,
      headers: { cookie: security.cookie },
    });
    expect(lookup.statusCode).toBe(200);
    expect(lookup.json().data.visitor.guestName).toBe("Rudi Hartono");

    const checkedIn = await app.inject({
      method: "POST",
      url: `/api/v1/visitors/check-in/${qrToken}`,
      headers: { cookie: security.cookie },
    });
    expect(checkedIn.statusCode).toBe(200);
    expect(checkedIn.json().data.visitor.status).toBe("CHECKED_IN");
    const visitorId = checkedIn.json().data.visitor.id as string;

    const doubleCheckIn = await app.inject({
      method: "POST",
      url: `/api/v1/visitors/check-in/${qrToken}`,
      headers: { cookie: security.cookie },
    });
    expect(doubleCheckIn.statusCode).toBe(409);

    const checkedOut = await app.inject({
      method: "POST",
      url: `/api/v1/visitors/${visitorId}/check-out`,
      headers: { cookie: security.cookie },
    });
    expect(checkedOut.statusCode).toBe(200);
    expect(checkedOut.json().data.visitor.status).toBe("CHECKED_OUT");
  });

  it("membuat tamu walk-in langsung check-in ke rumah tujuan", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const security = await loginWeb(app, securityPhone);

    const walkIn = await app.inject({
      method: "POST",
      url: "/api/v1/visitors/walk-in",
      headers: { cookie: security.cookie },
      payload: { houseCode: "F01", guestName: "Tamu Dadakan" },
    });
    expect(walkIn.statusCode).toBe(201);
    expect(walkIn.json().data.visitor.status).toBe("CHECKED_IN");
    expect(walkIn.json().data.visitor.isWalkIn).toBe(true);
    expect(walkIn.json().data.visitor.houseCode).toBe("F01");

    const unknownHouse = await app.inject({
      method: "POST",
      url: "/api/v1/visitors/walk-in",
      headers: { cookie: security.cookie },
      payload: { houseCode: "Z99", guestName: "Tamu Tidak Dikenal" },
    });
    expect(unknownHouse.statusCode).toBe(404);
  });

  it("mengirim notifikasi warga saat paket diterima dan mencatat pengambilan", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    const security = await loginWeb(app, securityPhone);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/packages",
      headers: { cookie: security.cookie },
      payload: { houseCode: "F01", recipientName: "Aziz Pratama", courier: "JNE" },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.package.status).toBe("NOTIFIED");
    const packageId = created.json().data.package.id as string;

    const residentPackages = await app.inject({
      method: "GET",
      url: "/api/v1/packages",
      headers: { cookie: resident.cookie },
    });
    expect(residentPackages.statusCode).toBe(200);
    expect(residentPackages.json().data.items.map((item: { id: string }) => item.id)).toContain(
      packageId,
    );

    const notifications = await app.inject({
      method: "GET",
      url: "/api/v1/notifications",
      headers: { cookie: resident.cookie },
    });
    expect(
      notifications.json().data.items.some((item: { entityId: string }) => item.entityId === packageId),
    ).toBe(true);

    const collected = await app.inject({
      method: "POST",
      url: `/api/v1/packages/${packageId}/collect`,
      headers: { cookie: security.cookie },
      payload: { collectedByName: "Aziz Pratama" },
    });
    expect(collected.statusCode).toBe(200);
    expect(collected.json().data.package.status).toBe("COLLECTED");

    const alreadyCollected = await app.inject({
      method: "POST",
      url: `/api/v1/packages/${packageId}/collect`,
      headers: { cookie: security.cookie },
      payload: { collectedByName: "Aziz Pratama" },
    });
    expect(alreadyCollected.statusCode).toBe(409);
  });

  it("membatasi kamera sesuai tingkat akses dan menerbitkan tiket mock", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const resident = await loginWeb(app);
    const security = await loginWeb(app, securityPhone);

    const residentCameras = await app.inject({
      method: "GET",
      url: "/api/v1/cameras",
      headers: { cookie: resident.cookie },
    });
    const residentCameraIds = residentCameras.json().data.items.map((item: { id: string }) => item.id);
    expect(residentCameraIds).toContain(demoIds.cameraPublic);
    expect(residentCameraIds).not.toContain(demoIds.cameraSecurity);

    const securityCameras = await app.inject({
      method: "GET",
      url: "/api/v1/cameras",
      headers: { cookie: security.cookie },
    });
    const securityCameraIds = securityCameras.json().data.items.map((item: { id: string }) => item.id);
    expect(securityCameraIds).toContain(demoIds.cameraPublic);
    expect(securityCameraIds).toContain(demoIds.cameraSecurity);

    const allowedTicket = await app.inject({
      method: "POST",
      url: `/api/v1/cameras/${demoIds.cameraPublic}/stream-ticket`,
      headers: { cookie: resident.cookie },
    });
    expect(allowedTicket.statusCode).toBe(200);
    expect(allowedTicket.json().data.mode).toBe("mock");
    expect(allowedTicket.json().data.ticket).toBeTruthy();

    const deniedTicket = await app.inject({
      method: "POST",
      url: `/api/v1/cameras/${demoIds.cameraSecurity}/stream-ticket`,
      headers: { cookie: resident.cookie },
    });
    expect(deniedTicket.statusCode).toBe(403);
  });

  it("menjalankan shift dan patroli security dari mulai sampai selesai", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const security = await loginWeb(app, securityPhone);

    const startedShift = await app.inject({
      method: "POST",
      url: "/api/v1/security/shift/start",
      headers: { cookie: security.cookie },
    });
    expect(startedShift.statusCode).toBe(200);
    expect(startedShift.json().data.shift.status).toBe("ACTIVE");

    const checkpoints = await app.inject({
      method: "GET",
      url: "/api/v1/patrol/checkpoints",
      headers: { cookie: security.cookie },
    });
    expect(checkpoints.statusCode).toBe(200);
    expect(checkpoints.json().data.items.length).toBeGreaterThanOrEqual(2);
    const [firstCheckpoint] = checkpoints.json().data.items as { id: string }[];
    if (!firstCheckpoint) throw new Error("expected at least one demo checkpoint");

    const startedPatrol = await app.inject({
      method: "POST",
      url: "/api/v1/patrol/session/start",
      headers: { cookie: security.cookie },
    });
    expect(startedPatrol.statusCode).toBe(200);

    const scanned = await app.inject({
      method: "POST",
      url: "/api/v1/patrol/session/scan",
      headers: { cookie: security.cookie },
      payload: { qrToken: `checkpoint-${firstCheckpoint.id}` },
    });
    expect(scanned.statusCode).toBe(200);
    expect(scanned.json().data.session.scans).toHaveLength(1);

    const duplicateScan = await app.inject({
      method: "POST",
      url: "/api/v1/patrol/session/scan",
      headers: { cookie: security.cookie },
      payload: { qrToken: `checkpoint-${firstCheckpoint.id}` },
    });
    expect(duplicateScan.statusCode).toBe(409);

    const endedPatrol = await app.inject({
      method: "POST",
      url: "/api/v1/patrol/session/end",
      headers: { cookie: security.cookie },
    });
    expect(endedPatrol.json().data.session.status).toBe("COMPLETED");

    const endedShift = await app.inject({
      method: "POST",
      url: "/api/v1/security/shift/end",
      headers: { cookie: security.cookie },
      payload: { notes: "Shift berjalan lancar" },
    });
    expect(endedShift.json().data.shift.status).toBe("COMPLETED");
  });

  it("membuat, membaca, dan memperbarui status laporan kejadian", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const security = await loginWeb(app, securityPhone);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/incidents",
      headers: { cookie: security.cookie },
      payload: {
        category: "SUSPICIOUS_ACTIVITY",
        title: "Orang tidak dikenal di area parkir",
        description: "Terlihat mengintai kendaraan warga selama 15 menit.",
        occurredAt: new Date().toISOString(),
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data.incident.status).toBe("OPEN");
    const incidentId = created.json().data.incident.id as string;

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/incidents",
      headers: { cookie: security.cookie },
    });
    expect(list.json().data.items.map((item: { id: string }) => item.id)).toContain(incidentId);

    const updated = await app.inject({
      method: "PATCH",
      url: `/api/v1/incidents/${incidentId}`,
      headers: { cookie: security.cookie },
      payload: { status: "RESOLVED", actionTaken: "Petugas melakukan patroli tambahan." },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.incident.status).toBe("RESOLVED");
  });

  it("merangkum dasbor security dari data operasional yang nyata", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const security = await loginWeb(app, securityPhone);

    await app.inject({
      method: "POST",
      url: "/api/v1/security/shift/start",
      headers: { cookie: security.cookie },
    });

    const dashboard = await app.inject({
      method: "GET",
      url: "/api/v1/security/dashboard",
      headers: { cookie: security.cookie },
    });
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.json().data.activeShift).not.toBeNull();
    expect(dashboard.json().data.camerasTotal).toBeGreaterThanOrEqual(2);
    expect(typeof dashboard.json().data.activeVisitorCount).toBe("number");
  });
});
