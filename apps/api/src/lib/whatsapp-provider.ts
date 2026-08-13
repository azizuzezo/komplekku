import { AppError } from "./errors";

export interface SendOtpOptions {
  botUrl: string;
  apiKey: string;
  phoneE164: string;
  otp: string;
}

export async function sendWhatsAppOtp(options: SendOtpOptions): Promise<void> {
  const { botUrl, apiKey, phoneE164, otp } = options;
  const digitsOnlyPhone = phoneE164.replace(/^\+/, "");

  // Format URL target: POST /api/otp/send
  const targetUrl = new URL("/api/otp/send", botUrl).toString();

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        phone: digitsOnlyPhone,
        otp,
      }),
    });

    if (response.ok) {
      return;
    }

    if (response.status === 503) {
      throw new AppError(
        503,
        "OTP_PROVIDER_OFFLINE",
        "Layanan WhatsApp bot sedang offline atau tidak terhubung. Silakan hubungkan WhatsApp bot terlebih dahulu.",
      );
    }

    if (response.status === 429) {
      throw new AppError(
        429,
        "OTP_RATE_LIMIT",
        "Pengiriman OTP ke nomor ini terlalu cepat. Silakan tunggu beberapa detik sebelum mencoba lagi.",
      );
    }

    if (response.status === 401) {
      throw new AppError(
        500,
        "OTP_PROVIDER_AUTH_ERROR",
        "Autentikasi ke server WhatsApp bot gagal (x-api-key tidak valid).",
      );
    }

    const errText = await response.text().catch(() => "");
    throw new AppError(
      502,
      "OTP_PROVIDER_ERROR",
      `Gagal mengirim WhatsApp OTP (Status ${response.status}): ${errText || response.statusText}`,
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      503,
      "OTP_PROVIDER_UNAVAILABLE",
      `Gagal menghubungi server WhatsApp bot: ${(error as Error).message}`,
    );
  }
}
