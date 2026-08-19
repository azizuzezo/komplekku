import { buildApp } from "../src/app";
import { demoIds, MemoryRepository } from "../src/testing/memory-repository";

export const testEnv = {
  APP_ENV: "local",
  AUTH_MODE: "development",
  ALLOW_DEV_OTP: true,
  DEV_OTP: "123456",
  SESSION_SECRET: "komplekku-test-session-secret-32-characters",
  WEB_ORIGIN: "http://localhost:3000",
  RATE_LIMIT_MAX: 10_000,
  LOG_LEVEL: "silent",
} as const;

/// `envOverrides` lets a test exercise config-driven behaviour (the in-app
/// updater's release settings, for instance) without a second helper.
export async function createTestApp(envOverrides: Record<string, string | boolean | number> = {}) {
  const repository = new MemoryRepository();
  const built = await buildApp({
    env: { ...testEnv, ...envOverrides },
    repository,
    logger: false,
  });
  return { ...built, repository };
}

export async function requestOtp(
  app: Awaited<ReturnType<typeof createTestApp>>["app"],
  phone = "0812 0000 0001",
) {
  return app.inject({
    method: "POST",
    url: "/api/v1/auth/otp/request",
    payload: { phone },
  });
}

export async function loginWeb(
  app: Awaited<ReturnType<typeof createTestApp>>["app"],
  phone = "0812 0000 0001",
) {
  const requestResponse = await requestOtp(app, phone);
  const requestId = requestResponse.json().data.requestId as string;
  const verifyResponse = await app.inject({
    method: "POST",
    url: "/api/v1/auth/otp/verify",
    payload: { requestId, code: "123456" },
  });
  const setCookie = verifyResponse.headers["set-cookie"];
  if (typeof setCookie !== "string") {
    throw new Error("Cookie sesi tidak diterbitkan pada test login web.");
  }
  return {
    requestId,
    response: verifyResponse,
    cookie: setCookie.split(";", 1)[0] ?? "",
  };
}

export { demoIds };
