import { describe, expect, it, vi } from "vitest";

import { sendWhatsAppOtp } from "../src/lib/whatsapp-provider";

describe("WhatsApp OTP provider", () => {
  it("mengirimkan request POST ke /api/otp/send dengan header x-api-key dan body JSON", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "success", message: "OTP sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      sendWhatsAppOtp({
        botUrl: "https://wabot-production-fa77.up.railway.app",
        apiKey: "komplekku-x-muter",
        phoneE164: "+628123456789",
        otp: "654321",
      }),
    ).resolves.toBeUndefined();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://wabot-production-fa77.up.railway.app/api/otp/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "komplekku-x-muter",
        },
        body: JSON.stringify({
          phone: "628123456789",
          otp: "654321",
        }),
      },
    );

    fetchSpy.mockRestore();
  });

  it("menangani status 503 dari bot sebagai OTP_PROVIDER_OFFLINE", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("WhatsApp disconnect", { status: 503 }),
    );

    await expect(
      sendWhatsAppOtp({
        botUrl: "https://wabot-production-fa77.up.railway.app",
        apiKey: "komplekku-x-muter",
        phoneE164: "+628123456789",
        otp: "123456",
      }),
    ).rejects.toThrow("Layanan WhatsApp bot sedang offline");

    fetchSpy.mockRestore();
  });

  it("menangani status 429 dari bot sebagai OTP_RATE_LIMIT", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Rate limited", { status: 429 }),
    );

    await expect(
      sendWhatsAppOtp({
        botUrl: "https://wabot-production-fa77.up.railway.app",
        apiKey: "komplekku-x-muter",
        phoneE164: "+628123456789",
        otp: "123456",
      }),
    ).rejects.toThrow("Pengiriman OTP ke nomor ini terlalu cepat");

    fetchSpy.mockRestore();
  });

  it("menangani status 401 dari bot sebagai error autentikasi", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(
      sendWhatsAppOtp({
        botUrl: "https://wabot-production-fa77.up.railway.app",
        apiKey: "wrong-key",
        phoneE164: "+628123456789",
        otp: "123456",
      }),
    ).rejects.toThrow("Autentikasi ke server WhatsApp bot gagal");

    fetchSpy.mockRestore();
  });
});
