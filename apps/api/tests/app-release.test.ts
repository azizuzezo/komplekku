import { appReleaseResponseSchema } from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp } from "./test-app";

describe("rilis aplikasi mobile", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("melaporkan tidak ada pembaruan saat APK belum dikonfigurasi", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());

    // The test config sets no MOBILE_APK_URL, which is the deployment default
    // — the app must simply never ask rather than error.
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/app/latest-release?versionCode=1",
    });
    expect(response.statusCode).toBe(200);
    expect(appReleaseResponseSchema.safeParse(response.json()).success).toBe(true);
    expect(response.json().data.release.available).toBe(false);
    expect(response.json().data.release.apkUrl).toBeNull();
  });

  it("dapat diakses tanpa login", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());

    // A warga whose app is too old to sign in must still be able to discover
    // the update, so this endpoint carries no auth guard.
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/app/latest-release",
    });
    expect(response.statusCode).toBe(200);
  });

  it("menawarkan pembaruan hanya untuk versi yang lebih lama", async () => {
    const { app } = await createTestApp({
      MOBILE_LATEST_VERSION_CODE: "5",
      MOBILE_LATEST_VERSION_NAME: "0.5.0",
      MOBILE_APK_URL: "https://example.test/komplekku.apk",
      MOBILE_RELEASE_NOTES: "Perbaikan adzan otomatis.",
    });
    closeCallbacks.push(() => app.close());

    const outdated = await app.inject({
      method: "GET",
      url: "/api/v1/app/latest-release?versionCode=2",
    });
    expect(outdated.json().data.release.available).toBe(true);
    expect(outdated.json().data.release.versionCode).toBe(5);
    expect(outdated.json().data.release.versionName).toBe("0.5.0");
    expect(outdated.json().data.release.releaseNotes).toBe("Perbaikan adzan otomatis.");
    expect(outdated.json().data.release.mandatory).toBe(false);

    const current = await app.inject({
      method: "GET",
      url: "/api/v1/app/latest-release?versionCode=5",
    });
    expect(current.json().data.release.available).toBe(false);

    // A build newer than the configured release — a tester on an unreleased
    // APK — must not be told to downgrade.
    const ahead = await app.inject({
      method: "GET",
      url: "/api/v1/app/latest-release?versionCode=9",
    });
    expect(ahead.json().data.release.available).toBe(false);
  });

  it("meneruskan flag pembaruan wajib", async () => {
    const { app } = await createTestApp({
      MOBILE_LATEST_VERSION_CODE: "7",
      MOBILE_APK_URL: "https://example.test/komplekku.apk",
      MOBILE_UPDATE_MANDATORY: "true",
    });
    closeCallbacks.push(() => app.close());

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/app/latest-release?versionCode=1",
    });
    expect(response.json().data.release.mandatory).toBe(true);
  });
});
