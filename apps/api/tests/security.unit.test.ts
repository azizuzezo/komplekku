import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  digestsMatch,
  normalizeIndonesianPhone,
  otpDigest,
  sessionTokenDigest,
} from "../src/lib/security";

describe("security primitives", () => {
  it("menormalisasi variasi nomor Indonesia ke E.164", () => {
    expect(normalizeIndonesianPhone("0812 0000 0001")).toBe("+6281200000001");
    expect(normalizeIndonesianPhone("6281200000001")).toBe("+6281200000001");
    expect(normalizeIndonesianPhone("+62-812-0000-0001")).toBe("+6281200000001");
  });

  it("mengikat digest OTP pada challenge, nomor, kode, dan secret", () => {
    const digest = otpDigest(
      "komplekku-test-session-secret-32-characters",
      "00000000-0000-4000-8000-000000000001",
      "+6281200000001",
      "123456",
    );
    expect(digest).not.toContain("123456");
    expect(digestsMatch(digest, digest)).toBe(true);
    expect(
      digestsMatch(
        digest,
        otpDigest(
          "komplekku-test-session-secret-32-characters",
          "00000000-0000-4000-8000-000000000001",
          "+6281200000001",
          "654321",
        ),
      ),
    ).toBe(false);
  });

  it("menerbitkan token opaque dan menyimpan representasi digest yang berbeda", () => {
    const token = createSessionToken();
    const digest = sessionTokenDigest(token);
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(digest).toHaveLength(64);
    expect(digest).not.toBe(token);
  });
});
