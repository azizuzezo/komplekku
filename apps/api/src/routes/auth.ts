import { randomUUID } from "node:crypto";

import { otpRequestInputSchema, otpVerifyInputSchema } from "@komplekku/contracts";
import type { FastifyInstance, preHandlerHookHandler } from "fastify";

import type { AppRepository } from "../domain/repository";
import { getAuthContext } from "../lib/authentication";
import type { AppConfig } from "../lib/env";
import { AppError } from "../lib/errors";
import { requestUserAgent, responseMeta } from "../lib/http";
import {
  createSessionToken,
  digestsMatch,
  generateRandomOtp,
  maskPhone,
  nextPathForAuthState,
  normalizeIndonesianPhone,
  otpDigest,
  sessionTokenDigest,
} from "../lib/security";
import { sendWhatsAppOtp } from "../lib/whatsapp-provider";

const invalidOtp = () =>
  new AppError(
    400,
    "OTP_INVALID_OR_EXPIRED",
    "Kode verifikasi tidak valid atau sudah kedaluwarsa.",
  );

export async function registerAuthRoutes(
  app: FastifyInstance,
  repository: AppRepository,
  config: AppConfig,
  authenticate: preHandlerHookHandler,
) {
  app.post(
    "/api/v1/auth/otp/request",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = otpRequestInputSchema.parse(request.body);
      const phoneE164 = normalizeIndonesianPhone(input.phone);
      let otpCode: string;

      if (config.AUTH_MODE === "development") {
        if (
          config.APP_ENV !== "local" ||
          !config.ALLOW_DEV_OTP ||
          !config.DEV_OTP
        ) {
          throw new AppError(
            503,
            "OTP_PROVIDER_UNAVAILABLE",
            "Pengiriman kode verifikasi belum tersedia.",
          );
        }
        otpCode = config.DEV_OTP;
      } else {
        // AUTH_MODE === "provider"
        otpCode = generateRandomOtp();
        await sendWhatsAppOtp({
          botUrl: config.WA_BOT_URL,
          apiKey: config.WA_BOT_API_KEY,
          phoneE164,
          otp: otpCode,
        });
      }

      const now = new Date();
      const requestId = randomUUID();
      const expiresAt = new Date(now.getTime() + config.OTP_TTL_SECONDS * 1000);
      const resendAt = new Date(now.getTime() + config.OTP_RESEND_SECONDS * 1000);
      await repository.replaceOtpChallenge({
        id: requestId,
        phoneE164,
        codeDigest: otpDigest(config.SESSION_SECRET, requestId, phoneE164, otpCode),
        maxAttempts: config.OTP_MAX_ATTEMPTS,
        expiresAt,
        now,
      });
      await repository.recordAudit({
        action: "auth.otp.requested",
        entityType: "OtpRequest",
        entityId: requestId,
        ipAddress: request.ip,
        userAgent: requestUserAgent(request),
        metadata: { phoneSuffix: phoneE164.slice(-4) },
      });

      return reply.status(202).send({
        data: {
          requestId,
          expiresAt: expiresAt.toISOString(),
          resendAt: resendAt.toISOString(),
        },
        meta: responseMeta(request),
      });
    },
  );

  app.post(
    "/api/v1/auth/otp/verify",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = otpVerifyInputSchema.parse(request.body);
      const now = new Date();
      const challenge = await repository.findOtp(input.requestId);
      if (
        !challenge ||
        challenge.consumedAt ||
        challenge.invalidatedAt ||
        challenge.expiresAt <= now ||
        challenge.attemptCount >= challenge.maxAttempts
      ) {
        throw invalidOtp();
      }

      const submittedDigest = otpDigest(
        config.SESSION_SECRET,
        challenge.id,
        challenge.phoneE164,
        input.code,
      );
      if (!digestsMatch(challenge.codeDigest, submittedDigest)) {
        await repository.incrementOtpFailure(challenge.id, now);
        throw invalidOtp();
      }

      const accessToken = createSessionToken();
      const expiresAt = new Date(now.getTime() + config.SESSION_TTL_SECONDS * 1000);
      const session = await repository.consumeOtpAndCreateSession({
        otpId: challenge.id,
        phoneE164: challenge.phoneE164,
        tokenDigest: sessionTokenDigest(accessToken),
        sessionExpiresAt: expiresAt,
        now,
      });
      if (!session) throw invalidOtp();

      const auth = await repository.findAuthSession(sessionTokenDigest(accessToken), now);
      if (!auth) {
        throw new AppError(
          500,
          "SESSION_CREATE_FAILED",
          "Sesi belum dapat dibuat. Silakan coba lagi.",
        );
      }
      const me = await repository.getMe(auth);
      if (!me) {
        throw new AppError(500, "USER_NOT_FOUND", "Data akun belum dapat dimuat.");
      }

      const isMobile = request.headers["x-client-platform"] === "mobile";
      if (!isMobile) {
        reply.setCookie(config.SESSION_COOKIE_NAME, accessToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: config.APP_ENV === "production",
          path: "/",
          maxAge: config.SESSION_TTL_SECONDS,
        });
      }
      await repository.recordAudit({
        communityId: auth.currentCommunityId,
        actorUserId: auth.userId,
        sessionId: auth.sessionId,
        action: "auth.login.succeeded",
        entityType: "Session",
        entityId: auth.sessionId,
        ipAddress: request.ip,
        userAgent: requestUserAgent(request),
      });

      return {
        data: {
          user: {
            id: me.id,
            displayName: me.displayName,
            phoneMasked: maskPhone(me.phoneE164),
          },
          authState: me.authState,
          nextPath: nextPathForAuthState(me.authState),
          session: { expiresAt: expiresAt.toISOString() },
          ...(isMobile ? { accessToken } : {}),
        },
        meta: responseMeta(request),
      };
    },
  );

  app.post("/api/v1/auth/logout", { preHandler: authenticate }, async (request, reply) => {
    const auth = getAuthContext(request);
    const now = new Date();
    await repository.revokeSession(auth.sessionId, now);
    await repository.recordAudit({
      communityId: auth.currentCommunityId,
      actorUserId: auth.userId,
      sessionId: auth.sessionId,
      action: "auth.logout",
      entityType: "Session",
      entityId: auth.sessionId,
      ipAddress: request.ip,
      userAgent: requestUserAgent(request),
    });
    reply.clearCookie(config.SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.APP_ENV === "production",
      path: "/",
    });
    return {
      data: { loggedOut: true },
      meta: responseMeta(request),
    };
  });
}
