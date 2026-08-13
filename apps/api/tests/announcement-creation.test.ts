import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

describe("pembuatan pengumuman & registrasi push token", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("mendaftarkan push token perangkat HP dengan sukses", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/notifications/device-token",
      headers: { cookie },
      payload: {
        token: "fcm-demo-device-token-12345",
        platform: "ANDROID",
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data.token).toBe("fcm-demo-device-token-12345");
  });

  it("membuat pengumuman baru oleh pengurus dan mengirimkan notifikasi ke warga", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    // Login as Super Admin (+6282145610774) who has announcement.manage permission
    const { cookie } = await loginWeb(app, "+6282145610774");

    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/announcements",
      headers: { cookie },
      payload: {
        title: "Kerja Bakti Akbar Blok F",
        summary: "Kerja bakti pembersihan saluran air hari Minggu besok.",
        body: "Diharapkan seluruh warga Blok F dapat berpartisipasi dalam kegiatan kerja bakti pembersihan lingkungan mulai pukul 07.00 WIB.",
        priority: "IMPORTANT",
      },
    });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().data.announcement.title).toBe("Kerja Bakti Akbar Blok F");
    expect(createRes.json().data.announcement.priority).toBe("IMPORTANT");

    // Login as resident and check notifications
    const residentLogin = await loginWeb(app, "+6281200000001");
    const notifRes = await app.inject({
      method: "GET",
      url: "/api/v1/notifications",
      headers: { cookie: residentLogin.cookie },
    });

    expect(notifRes.statusCode).toBe(200);
    const notifications = notifRes.json().data.items;
    const announcementNotif = notifications.find((n: any) => n.title.includes("Kerja Bakti Akbar"));
    expect(announcementNotif).toBeDefined();
    expect(announcementNotif.message).toContain("Kerja bakti pembersihan");
  });
});
