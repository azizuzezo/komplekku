import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, demoIds, loginWeb } from "./test-app";

describe("permission dan health", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("membedakan liveness dari readiness", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    expect((await app.inject({ method: "GET", url: "/health/live" })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/health/ready" })).statusCode).toBe(200);
    repository.setHealthy(false);
    const unavailable = await app.inject({ method: "GET", url: "/health/ready" });
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.json().error.code).toBe("NOT_READY");
  });

  it("menegakkan permission backend meski sesi valid", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const { cookie } = await loginWeb(app);
    repository.setPermissions(demoIds.user, ["community.read"]);

    const home = await app.inject({
      method: "GET",
      url: "/api/v1/home",
      headers: { cookie },
    });
    expect(home.statusCode).toBe(403);
    expect(home.json().error.code).toBe("FORBIDDEN");

    const announcements = await app.inject({
      method: "GET",
      url: "/api/v1/announcements",
      headers: { cookie },
    });
    expect(announcements.statusCode).toBe(403);

    const community = await app.inject({
      method: "GET",
      url: "/api/v1/communities/current",
      headers: { cookie },
    });
    expect(community.statusCode).toBe(200);
  });

  it("tidak menerima request protected tanpa cookie atau bearer", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const response = await app.inject({ method: "GET", url: "/api/v1/me" });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHENTICATED");
  });

  it("mempertahankan status 415 Fastify tanpa membocorkan pesan internal", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/announcements/${demoIds.announcementOne}/read`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: "unexpected=true",
    });

    expect(response.statusCode).toBe(415);
    expect(response.json()).toEqual({
      error: {
        code: "FST_ERR_CTP_INVALID_MEDIA_TYPE",
        message: "Format data permintaan tidak didukung.",
      },
    });
  });
});
