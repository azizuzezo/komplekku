import {
  meResponseSchema,
  otpRequestResponseSchema,
  otpVerifyResponseSchema,
} from "@komplekku/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { loadConfig } from "../src/lib/env";
import { sessionTokenDigest } from "../src/lib/security";
import { createTestApp, loginWeb, requestOtp, testEnv } from "./test-app";

describe("autentikasi OTP dan sesi", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("menghasilkan respons OTP generik tanpa membocorkan kode atau status akun", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());

    const known = await requestOtp(app);
    const unknown = await requestOtp(app, "0812 9999 9999");

    expect(known.statusCode).toBe(202);
    expect(unknown.statusCode).toBe(202);
    expect(otpRequestResponseSchema.safeParse(known.json()).success).toBe(true);
    expect(otpRequestResponseSchema.safeParse(unknown.json()).success).toBe(true);
    expect(JSON.stringify(known.json())).not.toContain("123456");
    expect(Object.keys(known.json().data).sort()).toEqual(Object.keys(unknown.json().data).sort());
  });

  it("memverifikasi resident demo, menerbitkan cookie HttpOnly, dan mempertahankan sesi", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const login = await loginWeb(app);

    expect(login.response.statusCode).toBe(200);
    expect(otpVerifyResponseSchema.safeParse(login.response.json()).success).toBe(true);
    expect(login.response.json().data.nextPath).toBe("/");
    expect(login.response.json().data.accessToken).toBeUndefined();
    expect(login.response.headers["set-cookie"]).toContain("HttpOnly");
    expect(login.response.headers["set-cookie"]).toContain("SameSite=Lax");

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: login.cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(meResponseSchema.safeParse(me.json()).success).toBe(true);
    expect(me.json().data.authState).toBe("READY");
    expect(me.json().data.currentContext.household.house.code).toBe("F01");
  });

  it("mengembalikan bearer hanya untuk klien mobile dan menerima token tersebut", async () => {
    const { app, repository } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const requested = await requestOtp(app);
    const requestId = requested.json().data.requestId as string;
    const verified = await app.inject({
      method: "POST",
      url: "/api/v1/auth/otp/verify",
      headers: { "x-client-platform": "mobile" },
      payload: { requestId, code: "123456" },
    });

    expect(verified.statusCode).toBe(200);
    expect(verified.headers["set-cookie"]).toBeUndefined();
    const token = verified.json().data.accessToken as string;
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(await repository.findAuthSession(token, new Date())).toBeNull();
    expect(await repository.findAuthSession(sessionTokenDigest(token), new Date())).not.toBeNull();

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
  });

  it("menolak kode salah, challenge terpakai ulang, dan sesi yang sudah logout", async () => {
    const { app } = await createTestApp();
    closeCallbacks.push(() => app.close());
    const requested = await requestOtp(app);
    const requestId = requested.json().data.requestId as string;

    const wrong = await app.inject({
      method: "POST",
      url: "/api/v1/auth/otp/verify",
      payload: { requestId, code: "000000" },
    });
    expect(wrong.statusCode).toBe(400);
    expect(wrong.json().error.code).toBe("OTP_INVALID_OR_EXPIRED");

    const verified = await app.inject({
      method: "POST",
      url: "/api/v1/auth/otp/verify",
      payload: { requestId, code: "123456" },
    });
    expect(verified.statusCode).toBe(200);
    const cookie = String(verified.headers["set-cookie"]).split(";", 1)[0];

    const reused = await app.inject({
      method: "POST",
      url: "/api/v1/auth/otp/verify",
      payload: { requestId, code: "123456" },
    });
    expect(reused.statusCode).toBe(400);

    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(200);

    const afterLogout = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie },
    });
    expect(afterLogout.statusCode).toBe(401);
  });

  it("menolak konfigurasi OTP development di luar APP_ENV=local", () => {
    expect(() =>
      loadConfig({
        ...testEnv,
        APP_ENV: "production",
        AUTH_MODE: "development",
      }),
    ).toThrow();
  });
});
