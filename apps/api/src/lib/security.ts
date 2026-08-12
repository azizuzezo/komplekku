import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { AuthState } from "@komplekku/contracts";

import { AppError } from "./errors";

export function normalizeIndonesianPhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, "");
  let normalized = compact;

  if (compact.startsWith("0")) normalized = `+62${compact.slice(1)}`;
  else if (compact.startsWith("62")) normalized = `+${compact}`;

  if (!/^\+62\d{8,13}$/.test(normalized)) {
    throw new AppError(422, "PHONE_INVALID", "Masukkan nomor HP Indonesia yang valid.");
  }

  return normalized;
}

export function maskPhone(phoneE164: string): string {
  return `${phoneE164.slice(0, 3)}••••${phoneE164.slice(-4)}`;
}

export function formatVehiclePlate(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function normalizeVehiclePlate(value: string): string {
  return formatVehiclePlate(value).replace(/[^A-Z0-9]/g, "");
}

export function otpDigest(
  secret: string,
  requestId: string,
  phoneE164: string,
  code: string,
): string {
  return createHmac("sha256", secret).update(`${requestId}:${phoneE164}:${code}`).digest("hex");
}

export function digestsMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sessionTokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function nextPathForAuthState(state: AuthState): string {
  switch (state) {
    case "READY":
      return "/";
    case "PENDING_APPROVAL":
      return "/menunggu-verifikasi";
    case "CONTEXT_REQUIRED":
      return "/mulai/konteks";
    case "NEEDS_RESIDENCY":
      return "/mulai/komunitas";
    case "REJECTED":
    case "SUSPENDED":
    case "ACCOUNT_CONFIGURATION_REQUIRED":
      return "/status-akun";
  }
}

export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}
